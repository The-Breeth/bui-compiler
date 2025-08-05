import { parseBuiFile as parseBuiFileFull, parseBuiFolder as parseBuiFolderFull } from './parser';
import { validateBuiAst as validateBuiAstFull } from './validator';
import { CompilerError as CompilerErrorFull, ParsedAST as ParsedASTFull } from './types';

export interface CompileResult {
  parsed: ParsedASTFull | null;
  errors: CompilerErrorFull[];
}

/**
 * Compiles a .bui file (single-file or folder mode) to a parsed object and errors.
 * @param inputPath Path to .bui file or folder
 * @param mode 'single' | 'folder'
 */
export async function compileBui(inputPath: string, mode: 'single' | 'folder'): Promise<CompileResult> {
  let parsed: ParsedASTFull | null = null;
  let errors: CompilerErrorFull[] = [];
  try {
    parsed = mode === 'single' ? await parseBuiFileFull(inputPath) : await parseBuiFolderFull(inputPath);
    errors = validateBuiAstFull(parsed);
  } catch (e: any) {
    errors.push({
      message: e.message || 'Unknown error',
      line: 0,
      column: 0,
      severity: 'error',
    });
    parsed = null;
  }
  return { parsed, errors };
}