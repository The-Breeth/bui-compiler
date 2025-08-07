import fs from "fs";
import path from "path";
import { CompileOptions, CompileResult, Profile, BPod } from "../types";
import { mergeBuiFiles } from "./merger";
import { validateProfile, validateBPod } from "./validator";

export function parseBUI(
  entryPath: string,
  options: CompileOptions = {}
): CompileResult {
  const content = fs.readFileSync(entryPath, "utf8");
  const blocks = splitBlocks(content);

  const filesBlock = blocks.find((b) => b.trim().startsWith("files:"));
  if (filesBlock) {
    try {
      const fileList = parseFilesBlock(filesBlock);
      const merged = mergeBuiFiles(entryPath, fileList, true); // true = add file markers
      return parseMergedContentWithSources(
        merged.mergedContent,
        merged.includedFiles,
        options
      );
    } catch (err: any) {
      return {
        ast: { version: "latest", bPods: [] },
        errors: [
          { message: err.message, line: 0, column: 0, severity: "error" },
        ],
      };
    }
  }

  // Single-file mode
  return parseMergedContentWithSources(
    content,
    [path.resolve(entryPath)],
    options
  );
}

function parseMergedContentWithSources(
  content: string,
  includedFiles: string[],
  options: CompileOptions
): CompileResult {
  const errors: any[] = [];
  const bPods: BPod[] = [];
  const bPodFileMap: Record<string, string> = {};
  let profile: Profile | undefined;
  let version = "latest";

  const fileSections = content.split(/^---FILE:(.+)$/m);
  let currentFile = includedFiles[0];

  fileSections.forEach((section) => {
    const possiblePath = path.resolve(section.trim());
    if (includedFiles.includes(possiblePath)) {
      currentFile = possiblePath;
      return;
    }

    const blocks = splitBlocks(section);
    blocks.forEach((block) => {
      if (!block.includes(":")) {
        errors.push({
          message: `Missing colon in declaration: ${block.split("\n")[0]}`,
          line: 0,
          column: 0,
          severity: "error",
        });
        return;
      }

      if (block.startsWith("version:")) {
        version = block
          .replace(/^version\s*:\s*/, "")
          .replace(/"/g, "")
          .trim();
      } else if (block.startsWith("profile:")) {
        try {
          const json = JSON.parse(block.replace(/^profile\s*:\s*/, ""));
          const result = validateProfile(json);
          if (result.success) {
            profile = result.data;
          } else {
            result.error.issues.forEach((e) =>
              errors.push({
                message: e.message,
                line: 0,
                column: 0,
                severity: "error",
              })
            );
          }
        } catch {
          errors.push({
            message: "Invalid profile JSON",
            line: 0,
            column: 0,
            severity: "error",
          });
        }
      } else if (block.startsWith("b-pod:")) {
        const nameMatch = block.match(/^b-pod\s*:\s*"([^"]+)"/);
        if (!nameMatch || !nameMatch[1].trim()) {
          errors.push({
            message: "BPod name is required",
            line: 0,
            column: 0,
            severity: "error",
          });
          return;
        }
        const name = nameMatch[1].trim();
        if (bPods.some((bp) => bp.name === name)) {
          errors.push({
            message: `Duplicate b-pod name: ${name}`,
            line: 0,
            column: 0,
            severity: "error",
          });
          return;
        }
        try {
          const jsonBodyMatch = block.match(/\{([\s\S]*)\}$/);
          if (!jsonBodyMatch) throw new Error("BPod body missing");
          const json = JSON.parse(`{${jsonBodyMatch[1]}}`);
          const bPod: BPod = { name, ...json };
          const result = validateBPod(bPod);
          if (result.success) {
            bPods.push(bPod);
            bPodFileMap[name] = currentFile;
          } else {
            result.error.issues.forEach((e) =>
              errors.push({
                message: e.message,
                line: 0,
                column: 0,
                severity: "error",
              })
            );
          }
        } catch (e: any) {
          errors.push({
            message: `Invalid b-pod block for ${name}: ${e.message}`,
            line: 0,
            column: 0,
            severity: "error",
          });
        }
      }
    });
  });

  if (version !== "1.0.0") {
    errors.push({
      message: `Invalid version: ${version}, expected "1.0.0"`,
      line: 0,
      column: 0,
      severity: "error",
    });
  }

  const ast = { version, profile, bPods };
  const result: CompileResult = { ast, errors };
  if (options.withMetadata) result.metadata = { includedFiles, bPodFileMap };
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
    if (!Array.isArray(json) || !json.every((f) => typeof f === "string")) {
      throw new Error("files must be a JSON array of strings");
    }
    return json;
  } catch {
    throw new Error("Invalid JSON format for files block");
  }
}
