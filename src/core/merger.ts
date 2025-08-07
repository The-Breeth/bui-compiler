import fs from "fs";
import path from "path";

export function mergeBuiFiles(
  entryPath: string,
  fileList: string[],
  withMarkers = false
) {
  const includedFiles: string[] = [];
  const entryAbs = path.resolve(entryPath);
  const entryContent = fs.readFileSync(entryAbs, "utf8");
  includedFiles.push(entryAbs);

  let mergedContent = removeFilesBlock(entryContent);

  fileList.forEach((filePath) => {
    const resolved = path.resolve(path.dirname(entryAbs), filePath);
    if (fs.existsSync(resolved)) {
      const content = fs.readFileSync(resolved, "utf8");
      mergedContent += withMarkers
        ? `\n---FILE:${resolved}\n${content}`
        : `\n---\n${content}`;
      includedFiles.push(resolved);
    } else {
      throw new Error(`Included file not found: ${resolved}`);
    }
  });

  return { mergedContent, includedFiles };
}

function removeFilesBlock(content: string) {
  return content
    .split(/^---$/m)
    .map((block) => (block.trim().startsWith("files:") ? "" : block))
    .filter(Boolean)
    .join("\n---\n");
}
