import fs from "fs";
import path from "path";
import { CompileOptions, CompileResult, Profile, BPod, Token, ParseContext, CompilerWarning } from "../types";
import { mergeBuiFiles, MergeResult } from "./merger";
import { validateProfile, validateBPod, validateFileExtensions, validateBodyTemplate } from "./validator";
import { ErrorCode, WarningCode, createError, createWarning, createParseContext, updateParseContext } from "./error-reporter";

export function parseBUI(
  entryPath: string,
  options: CompileOptions = {}
): CompileResult {
  const startTime = Date.now();
  const errors: any[] = [];
  const warnings: CompilerWarning[] = [];
  
  try {
    // Check if content is provided directly in options
    const content = (options as any).content;
    
    if (content) {
      // Direct content mode - skip file system checks
      const blocks = splitBlocks(content);
      
      // Check for multi-file mode (BPod extension only)
      const filesBlock = blocks.find((b) => b.trim().startsWith("files:"));
      if (filesBlock) {
        // In direct content mode, we don't support multi-file projects
        return {
          ast: { version: "1.0.0", bPods: [] },
          errors: [createError(
            ErrorCode.INVALID_SYNTAX,
            `Multi-file projects are not supported in direct content mode`,
            createParseContext(entryPath, content, 0)
          )],
          warnings: [],
          success: false
        };
      }
      
      return parseMergedContentWithSources(
        content,
        [entryPath],
        options,
        startTime,
        { totalFiles: 1, totalSize: content.length, fileSizes: { [entryPath]: content.length } }
      );
    }
    
    // File system mode
    // Check if entry file exists
    if (!fs.existsSync(entryPath)) {
      return {
        ast: { version: "1.0.0", bPods: [] },
        errors: [createError(
          ErrorCode.FILE_NOT_FOUND,
          `Entry file not found: ${entryPath}`,
          createParseContext(entryPath, "", 0)
        )],
        warnings: [],
        success: false
      };
    }

    // Enforce index.bui as the only entry point
    const fileName = path.basename(entryPath);
    if (fileName !== "index.bui") {
      return {
        ast: { version: "1.0.0", bPods: [] },
        errors: [createError(
          ErrorCode.INVALID_FILE_PATH,
          `Only index.bui files can be used as entry points. Got: ${fileName}`,
          createParseContext(entryPath, "", 0),
          "Rename your file to index.bui or use index.bui as the entry point"
        )],
        warnings: [],
        success: false
      };
    }
    
    const fileContent = fs.readFileSync(entryPath, "utf8");
    const blocks = splitBlocks(fileContent);
    
    // Check for multi-file mode (BPod extension only)
    const filesBlock = blocks.find((b) => b.trim().startsWith("files:"));
    if (filesBlock) {
      try {
        const fileList = parseFilesBlock(filesBlock);
        
        // Validate file paths for security
        const baseDir = path.dirname(entryPath);
        for (const filePath of fileList) {
          const validation = validateFilePath(filePath, baseDir);
          if (!validation.valid) {
            errors.push(createError(
              ErrorCode.INVALID_FILE_PATH,
              `Invalid file path: ${filePath} - ${validation.error}`,
              createParseContext(filePath, "", 0)
            ));
          }
        }
        
        if (errors.length > 0) {
          return {
            ast: { version: "1.0.0", bPods: [] },
            errors,
            warnings,
            success: false
          };
        }
        
        const merged = mergeBuiFiles(entryPath, fileList, options);
        
        // Collect errors and warnings from merger
        errors.push(...merged.errors);
        warnings.push(...merged.warnings);
        
        if (merged.errors.length > 0) {
          return {
            ast: { version: "1.0.0", bPods: [] },
            errors,
            warnings,
            success: false
          };
        }
        
        return parseMergedContentWithSources(
          merged.mergedContent,
          merged.includedFiles,
          options,
          startTime,
          merged.stats
        );
      } catch (err: any) {
        return {
          ast: { version: "1.0.0", bPods: [] },
          errors: [createError(
            ErrorCode.INVALID_FILES_BLOCK,
            `Failed to parse files block: ${err.message}`,
            createParseContext(entryPath, content, 0)
          )],
          warnings: [],
          success: false
        };
      }
    }
    
    // Single-file mode (index.bui only)
    return parseMergedContentWithSources(
      fileContent,
      [path.resolve(entryPath)],
      options,
      startTime,
      { totalFiles: 1, totalSize: fileContent.length, fileSizes: { [path.resolve(entryPath)]: fileContent.length } }
    );
  } catch (err: any) {
    return {
      ast: { version: "1.0.0", bPods: [] },
      errors: [createError(
        ErrorCode.UNKNOWN_ERROR,
        `Unexpected error: ${err.message}`,
        createParseContext(entryPath, "", 0)
      )],
      warnings: [],
      success: false
    };
  }
}

function parseMergedContentWithSources(
  content: string,
  includedFiles: string[],
  options: CompileOptions,
  startTime: number,
  stats: { totalFiles: number; totalSize: number; fileSizes: Record<string, number> }
): CompileResult {
  // Debug: Check if content is undefined
  if (content === undefined) {
    console.error('Content is undefined!');
    return {
      ast: { version: "1.0.0", bPods: [] },
      errors: [createError(
        ErrorCode.UNKNOWN_ERROR,
        "Content is undefined",
        createParseContext("unknown", "", 0)
      )],
      warnings: [],
      success: false
    };
  }
  
  const errors: any[] = [];
  const warnings: CompilerWarning[] = [];
  const bPods: BPod[] = [];
  const bPodFileMap: Record<string, string> = {};
  let profile: Profile | undefined;
  let version = "1.0.0";
  
  const fileSections = content.split(/^---FILE:(.+)$/m);
  let currentFile = includedFiles[0];
  let lineOffset = 0;
  
  fileSections.forEach((section, sectionIndex) => {
    // Skip empty sections
    if (!section || !section.trim()) {
      return;
    }
    
    // Check if this section is a file path (only for multi-file projects)
    if (section.trim().length < 200 && includedFiles.length > 1) {
      const possiblePath = path.resolve(section.trim());
      if (includedFiles.includes(possiblePath)) {
        currentFile = possiblePath;
        // Calculate line offset for this file
        const index = content.indexOf(section);
        if (index !== -1) {
          lineOffset = content.split('\n').slice(0, index).length;
        }
        return;
      }
    }
    
    const context = createParseContext(currentFile, section, lineOffset);
    const blocks = splitBlocks(section);
    
    blocks.forEach((block, blockIndex) => {
      const blockContext = updateParseContext(context, blockIndex + 1, 1);
      
      if (!block.includes(":")) {
        errors.push(createError(
          ErrorCode.MISSING_COLON,
          `Missing colon in declaration: ${block.split("\n")[0]}`,
          blockContext,
          "Each declaration should follow the format: 'type: value'"
        ));
        return;
      }
      
      // Parse version (only from index.bui)
      if (block.startsWith("version:") && currentFile === includedFiles[0]) {
        const versionValue = block
          .replace(/^version\s*:\s*/, "")
          .replace(/"/g, "")
          .trim();
        
        if (versionValue !== "1.0.0") {
          errors.push(createError(
            ErrorCode.INVALID_VERSION,
            `Invalid version: ${versionValue}, expected "1.0.0"`,
            blockContext,
            "Use version: \"1.0.0\""
          ));
        } else {
          version = versionValue;
        }
      }
      
      // Parse profile (only from index.bui)
      else if (block.startsWith("profile:") && currentFile === includedFiles[0]) {
        try {
          const json = JSON.parse(block.replace(/^profile\s*:\s*/, ""));
          const result = validateProfile(json);
          
          if (result.success) {
            profile = result.data;
            if (result.error) {
              // Convert validation issues to warnings
              result.error.issues.forEach(issue => {
                warnings.push(createWarning(
                  issue.code as WarningCode,
                  issue.message,
                  blockContext,
                  issue.expected ? `Consider adding: ${issue.expected}` : undefined
                ));
              });
            }
          } else {
            result.error?.issues.forEach(issue => {
              errors.push(createError(
                issue.code as ErrorCode,
                issue.message,
                blockContext,
                issue.expected ? `Expected: ${issue.expected}` : undefined
              ));
            });
          }
        } catch (parseError: any) {
          errors.push(createError(
            ErrorCode.INVALID_PROFILE_JSON,
            `Invalid profile JSON: ${parseError.message}`,
            blockContext,
            "Ensure the profile block contains valid JSON"
          ));
        }
      }
      
      // Parse b-pod (from any file)
      else if (block.startsWith("b-pod:")) {
        const nameMatch = block.match(/^b-pod\s*:\s*"([^"]+)"/);
        if (!nameMatch || !nameMatch[1].trim()) {
          errors.push(createError(
            ErrorCode.MISSING_BPOD_NAME,
            "BPod name is required",
            blockContext,
            "Use format: b-pod: \"Name\" { ... }"
          ));
          return;
        }
        
        const name = nameMatch[1].trim();
        if (bPods.some((bp) => bp.name === name)) {
          errors.push(createError(
            ErrorCode.DUPLICATE_BPOD_NAME,
            `Duplicate b-pod name: ${name}`,
            blockContext,
            "Ensure each BPod has a unique name"
          ));
          return;
        }
        
        try {
          const jsonBodyMatch = block.match(/\{([\s\S]*)\}$/);
          if (!jsonBodyMatch) {
            errors.push(createError(
              ErrorCode.INVALID_BPOD_JSON,
              "BPod body missing",
              blockContext,
              "Use format: b-pod: \"Name\" { ... }"
            ));
            return;
          }
          
          const json = JSON.parse(`{${jsonBodyMatch[1]}}`);
          const bPod: BPod = { name, ...json };
          
          // Validate BPod
          const result = validateBPod(bPod);
          if (result.success) {
            // Additional validations
            const fileExtResult = validateFileExtensions(bPod.accepts);
            if (!fileExtResult.success) {
              fileExtResult.error?.issues.forEach(issue => {
                errors.push(createError(
                  issue.code as ErrorCode,
                  issue.message,
                  blockContext,
                  issue.expected
                ));
              });
              return;
            }
            
            const bodyTemplateResult = validateBodyTemplate(bPod.api.bodyTemplate, bPod.api.fileParams);
            if (!bodyTemplateResult.success) {
              bodyTemplateResult.error?.issues.forEach(issue => {
                errors.push(createError(
                  issue.code as ErrorCode,
                  issue.message,
                  blockContext,
                  issue.expected
                ));
              });
              return;
            }
            
            bPods.push(bPod);
            bPodFileMap[name] = currentFile;
            
            // Check for warnings
            if (result.error) {
              result.error.issues.forEach(issue => {
                warnings.push(createWarning(
                  issue.code as WarningCode,
                  issue.message,
                  blockContext,
                  issue.expected ? `Consider adding: ${issue.expected}` : undefined
                ));
              });
            }
          } else {
            result.error?.issues.forEach(issue => {
              errors.push(createError(
                issue.code as ErrorCode,
                issue.message,
                blockContext,
                issue.expected ? `Expected: ${issue.expected}` : undefined
              ));
            });
          }
        } catch (parseError: any) {
          errors.push(createError(
            ErrorCode.INVALID_BPOD_JSON,
            `Invalid b-pod JSON for ${name}: ${parseError.message}`,
            blockContext,
            "Ensure the BPod block contains valid JSON"
          ));
        }
      }
      
      // Reject version/profile from non-index files
      else if ((block.startsWith("version:") || block.startsWith("profile:")) && currentFile !== includedFiles[0]) {
        errors.push(createError(
          ErrorCode.INVALID_SYNTAX,
          `${block.split(":")[0]} declarations are only allowed in index.bui`,
          blockContext,
          "Move version and profile declarations to index.bui only"
        ));
      }
    });
  });
  
  const parseTime = Date.now() - startTime;
  const ast = { version, profile, bPods };
  const success = errors.filter(e => e.severity === 'error').length === 0;
  
  const result: CompileResult = { 
    ast, 
    errors, 
    warnings,
    success 
  };
  
  if (options.withMetadata) {
    result.metadata = { 
      includedFiles, 
      bPodFileMap,
      parseTime,
      totalSize: stats.totalSize,
      warnings
    };
  }
  
  return result;
}

function splitBlocks(content: string): string[] {
  return content
    .split(/^---$/m)
    .map((b) => b.trim())
    .filter(Boolean);
}

function parseFilesBlock(block: string): string[] {
  try {
    const rawJson = block.replace(/^files\s*:\s*/, "").trim();
    const json = JSON.parse(rawJson);
    
    if (!Array.isArray(json)) {
      throw new Error("files must be a JSON array");
    }
    
    if (!json.every((f) => typeof f === "string")) {
      throw new Error("files array must contain only strings");
    }
    
    if (json.length === 0) {
      throw new Error("files array cannot be empty");
    }
    
    return json;
  } catch (parseError: any) {
    throw new Error(`Invalid JSON format for files block: ${parseError.message}`);
  }
}

/**
 * Validate file path for security
 */
function validateFilePath(filePath: string, baseDir: string): { valid: boolean; error?: string } {
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
