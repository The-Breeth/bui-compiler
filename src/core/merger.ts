import fs from "fs";
import path from "path";
import { CompileOptions, CompileResult, CompilerError, CompilerWarning } from "../types";
import { ErrorCode, createError, createParseContext } from "./error-reporter";

export interface MergeResult {
  mergedContent: string;
  includedFiles: string[];
  errors: CompilerError[];
  warnings: CompilerWarning[];
  stats: {
    totalFiles: number;
    totalSize: number;
    fileSizes: Record<string, number>;
  };
}

export function mergeBuiFiles(
  entryPath: string,
  fileList: string[],
  options: CompileOptions = {}
): MergeResult {
  const errors: CompilerError[] = [];
  const warnings: CompilerWarning[] = [];
  const includedFiles: string[] = [];
  const fileSizes: Record<string, number> = {};
  
  const entryAbs = path.resolve(entryPath);
  
  // Validate entry file
  if (!fs.existsSync(entryAbs)) {
    errors.push(createError(
      ErrorCode.FILE_NOT_FOUND,
      `Entry file not found: ${entryPath}`,
      createParseContext(entryPath, "", 0)
    ));
    return { mergedContent: "", includedFiles: [], errors, warnings, stats: { totalFiles: 0, totalSize: 0, fileSizes } };
  }
  
  // Check file size limits
  const entryStats = fs.statSync(entryAbs);
  const maxFileSize = options.maxFileSize || 1024 * 1024; // 1MB default
  
  if (entryStats.size > maxFileSize) {
    errors.push(createError(
      ErrorCode.FILE_TOO_LARGE,
      `Entry file too large: ${entryStats.size} bytes (max: ${maxFileSize} bytes)`,
      createParseContext(entryPath, "", 0)
    ));
  }
  
  // Check file count limits
  const maxFiles = options.maxFiles || 100; // 100 files default
  if (fileList.length > maxFiles) {
    errors.push(createError(
      ErrorCode.TOO_MANY_FILES,
      `Too many files: ${fileList.length} (max: ${maxFiles})`,
      createParseContext(entryPath, "", 0)
    ));
  }
  
  // Read entry file content
  let entryContent: string;
  try {
    entryContent = fs.readFileSync(entryAbs, "utf8");
    fileSizes[entryAbs] = entryStats.size;
  } catch (error) {
    errors.push(createError(
      ErrorCode.FILE_READ_ERROR,
      `Failed to read entry file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      createParseContext(entryPath, "", 0)
    ));
    return { mergedContent: "", includedFiles: [], errors, warnings, stats: { totalFiles: 0, totalSize: 0, fileSizes } };
  }
  
  includedFiles.push(entryAbs);
  let mergedContent = removeFilesBlock(entryContent);
  let totalSize = entryStats.size;
  
  // Process included files - extract only BPods
  for (const filePath of fileList) {
    try {
      const resolved = path.resolve(path.dirname(entryAbs), filePath);
      
      // Check for circular dependencies
      if (includedFiles.includes(resolved)) {
        warnings.push({
          message: `Circular dependency detected: ${filePath}`,
          line: 0,
          column: 0,
          severity: "warning",
          code: "W004",
          file: resolved,
          context: `File ${filePath} is already included`,
          suggestion: "Remove duplicate file references"
        });
        continue;
      }
      
      if (!fs.existsSync(resolved)) {
        errors.push(createError(
          ErrorCode.FILE_NOT_FOUND,
          `Included file not found: ${resolved}`,
          createParseContext(filePath, "", 0)
        ));
        continue;
      }
      
      const fileStats = fs.statSync(resolved);
      
      // Check file size
      if (fileStats.size > maxFileSize) {
        errors.push(createError(
          ErrorCode.FILE_TOO_LARGE,
          `File too large: ${filePath} (${fileStats.size} bytes, max: ${maxFileSize} bytes)`,
          createParseContext(filePath, "", 0)
        ));
        continue;
      }
      
      // Read file content
      const content = fs.readFileSync(resolved, "utf8");
      fileSizes[resolved] = fileStats.size;
      totalSize += fileStats.size;
      
      // Extract only BPods from the file (skip version, profile, files blocks)
      const extractedBPods = extractBPodsFromContent(content);
      
      if (extractedBPods.length > 0) {
        // Add BPods to merged content with separators
        mergedContent += `\n---\n${extractedBPods.join('\n---\n')}`;
      }
      
      includedFiles.push(resolved);
      
    } catch (error) {
      errors.push(createError(
        ErrorCode.FILE_READ_ERROR,
        `Failed to read file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        createParseContext(filePath, "", 0)
      ));
    }
  }
  
  return {
    mergedContent,
    includedFiles,
    errors,
    warnings,
    stats: {
      totalFiles: includedFiles.length,
      totalSize,
      fileSizes
    }
  };
}

/**
 * Remove the files block from content
 */
function removeFilesBlock(content: string): string {
  const blocks = content.split(/^---$/m);
  const filteredBlocks = blocks.filter(block => !block.trim().startsWith("files:"));
  
  if (filteredBlocks.length === blocks.length) {
    return content; // No files block found
  }
  
  return filteredBlocks
    .filter(Boolean)
    .join("\n---\n");
}

/**
 * Extract only BPod blocks from content (skip version, profile, files)
 */
function extractBPodsFromContent(content: string): string[] {
  const blocks = content.split(/^---$/m);
  const bpodBlocks = blocks.filter(block => 
    block.trim().startsWith("b-pod:") && 
    !block.trim().startsWith("version:") && 
    !block.trim().startsWith("profile:") && 
    !block.trim().startsWith("files:")
  );
  
  return bpodBlocks.map(block => block.trim()).filter(Boolean);
}

/**
 * Validate file paths for security
 */
export function validateFilePath(filePath: string, baseDir: string): { valid: boolean; error?: string } {
  const resolved = path.resolve(baseDir, filePath);
  const baseResolved = path.resolve(baseDir);
  
  // Check for path traversal attacks
  if (!resolved.startsWith(baseResolved)) {
    return {
      valid: false,
      error: "Path traversal detected"
    };
  }
  
  // Only allow .bui files
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext !== '.bui') {
    return {
      valid: false,
      error: `Only .bui files are supported, got: ${ext}`
    };
  }
  
  return { valid: true };
}

/**
 * Get file statistics for monitoring
 */
export function getFileStats(filePath: string): { size: number; lastModified: Date; exists: boolean } {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      lastModified: stats.mtime,
      exists: true
    };
  } catch {
    return {
      size: 0,
      lastModified: new Date(0),
      exists: false
    };
  }
}

/**
 * Check if file is readable
 */
export function isFileReadable(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}
