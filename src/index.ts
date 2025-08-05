import { parseFromFiles } from './parser';
import { validateBuiAst } from './validator';
import { renderAstToHtml } from './render';
import { ParsedAST, CompilerError } from './types';

export interface CompileResult {
  ast: ParsedAST;
  errors: CompilerError[];
}

// Accepts raw .bui files mapped by filename and returns AST + validation errors
export async function compile(files: Record<string, string>): Promise<CompileResult> {
  const ast = await parseFromFiles(files);
  const errors = validateBuiAst(ast);
  return { ast, errors };
}

// Convenience function to get rendered HTML from raw files
export async function render(files: Record<string, string>): Promise<string> {
  const { ast } = await compile(files);
  return renderAstToHtml(ast);
}
