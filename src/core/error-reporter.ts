import { CompilerError } from "../types";

/**
 * Create a standardized compiler error object with line/column mapping.
 */
export function createError(
  message: string,
  text: string,
  index: number,
  severity: "error" | "warning" = "error"
): CompilerError {
  const { line, column } = locateLineColumn(text, index);
  return { message, line, column, severity };
}

/**
 * Find line and column from string index.
 */
export function locateLineColumn(text: string, index: number) {
  const lines = text.slice(0, index).split("\n");
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;
  return { line, column };
}
