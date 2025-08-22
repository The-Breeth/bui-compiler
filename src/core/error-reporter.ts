import { CompilerError, CompilerWarning, ParseContext, Token } from "../types";

export enum ErrorCode {
  // Parsing errors
  INVALID_SYNTAX = "E001",
  MISSING_COLON = "E002",
  INVALID_VERSION = "E003",
  INVALID_PROFILE_JSON = "E004",
  INVALID_BPOD_JSON = "E005",
  MISSING_BPOD_NAME = "E006",
  DUPLICATE_BPOD_NAME = "E007",
  INVALID_FILES_BLOCK = "E008",
  
  // Validation errors
  PROFILE_NAME_REQUIRED = "E101",
  PROFILE_DESCRIPTION_TOO_LONG = "E102",
  INVALID_LOGO_URL = "E103",
  INVALID_WEBSITE_URL = "E104",
  
  // BPod validation errors
  BPOD_NAME_REQUIRED = "E201",
  BPOD_ACCEPTS_EMPTY = "E202",
  BPOD_ACCEPTS_INVALID_FORMAT = "E203",
  BPOD_SUBMIT_LABEL_REQUIRED = "E204",
  BPOD_SUBMIT_ACTION_REQUIRED = "E205",
  BPOD_API_URL_INVALID = "E206",
  BPOD_API_METHOD_INVALID = "E207",
  BPOD_API_BODY_TEMPLATE_MISSING_WEBHOOK = "E208",
  BPOD_INPUT_OPTIONS_REQUIRED = "E209",
  
  // File handling errors
  FILE_NOT_FOUND = "E301",
  FILE_TOO_LARGE = "E302",
  TOO_MANY_FILES = "E303",
  FILE_READ_ERROR = "E304",
  INVALID_FILE_PATH = "E305",
  
  // System errors
  TIMEOUT_ERROR = "E401",
  MEMORY_ERROR = "E402",
  UNKNOWN_ERROR = "E499"
}

export enum WarningCode {
  // Parsing warnings
  DEPRECATED_SYNTAX = "W001",
  UNUSED_INPUT = "W002",
  MISSING_DESCRIPTION = "W003",
  
  // Validation warnings
  PROFILE_MISSING_LOGO = "W101",
  PROFILE_MISSING_WEBSITE = "W102",
  BPOD_MISSING_DESCRIPTION = "W201",
  BPOD_MISSING_TAGS = "W202",
  API_MISSING_HEADERS = "W203",
  API_MISSING_TIMEOUT = "W204"
}

/**
 * Get user-friendly error message with explanation
 */
export function getErrorMessage(code: ErrorCode): { message: string; explanation: string; fix: string } {
  const errorMessages: Record<ErrorCode, { message: string; explanation: string; fix: string }> = {
    // Parsing errors
    [ErrorCode.INVALID_SYNTAX]: {
      message: "Invalid syntax in BUI file",
      explanation: "The BUI file contains syntax that doesn't follow the correct format",
      fix: "Check your BUI file structure and make sure all sections are properly formatted"
    },
    [ErrorCode.MISSING_COLON]: {
      message: "Missing colon in declaration",
      explanation: "A section declaration is missing the required colon",
      fix: "Add a colon after section names like 'version:', 'profile:', 'b-pod:'"
    },
    [ErrorCode.INVALID_VERSION]: {
      message: "Invalid version format",
      explanation: "The version must be '1.0.0' (only this version is supported)",
      fix: "Change your version to '1.0.0'"
    },
    [ErrorCode.INVALID_PROFILE_JSON]: {
      message: "Invalid profile JSON",
      explanation: "The profile section contains invalid JSON format",
      fix: "Check your profile JSON syntax and make sure all quotes and brackets are correct"
    },
    [ErrorCode.INVALID_BPOD_JSON]: {
      message: "Invalid BPod JSON",
      explanation: "The BPod section contains invalid JSON format",
      fix: "Check your BPod JSON syntax and make sure all quotes and brackets are correct"
    },
    [ErrorCode.MISSING_BPOD_NAME]: {
      message: "Missing BPod name",
      explanation: "A BPod declaration is missing its name",
      fix: "Add a name to your BPod like 'b-pod: \"My Service\"'"
    },
    [ErrorCode.DUPLICATE_BPOD_NAME]: {
      message: "Duplicate BPod name",
      explanation: "Multiple BPods have the same name",
      fix: "Give each BPod a unique name"
    },
    [ErrorCode.INVALID_FILES_BLOCK]: {
      message: "Invalid files block",
      explanation: "The files section is not properly formatted",
      fix: "Use format: files: [\"file1.bui\", \"file2.bui\"]"
    },

    // Validation errors
    [ErrorCode.PROFILE_NAME_REQUIRED]: {
      message: "Profile name is required",
      explanation: "Every profile must have a name",
      fix: "Add a 'name' field to your profile"
    },
    [ErrorCode.PROFILE_DESCRIPTION_TOO_LONG]: {
      message: "Profile description too long",
      explanation: "Profile description exceeds maximum length",
      fix: "Keep description under 500 characters"
    },
    [ErrorCode.INVALID_LOGO_URL]: {
      message: "Invalid logo URL",
      explanation: "Logo URL must be a valid HTTPS URL",
      fix: "Use a valid HTTPS URL for your logo"
    },
    [ErrorCode.INVALID_WEBSITE_URL]: {
      message: "Invalid website URL",
      explanation: "Website URL must be a valid HTTPS URL",
      fix: "Use a valid HTTPS URL for your website"
    },

    // BPod validation errors
    [ErrorCode.BPOD_NAME_REQUIRED]: {
      message: "BPod name is required",
      explanation: "Every BPod must have a name",
      fix: "Add a 'name' field to your BPod"
    },
    [ErrorCode.BPOD_ACCEPTS_EMPTY]: {
      message: "BPod accepts array is empty",
      explanation: "BPod must accept at least one file type",
      fix: "Add file types to 'accepts' array like [\"txt\", \"pdf\"]"
    },
    [ErrorCode.BPOD_ACCEPTS_INVALID_FORMAT]: {
      message: "Invalid file type format",
      explanation: "File types must be lowercase letters only",
      fix: "Use lowercase file extensions like \"txt\", \"pdf\", \"jpg\""
    },
    [ErrorCode.BPOD_SUBMIT_LABEL_REQUIRED]: {
      message: "Submit label is required",
      explanation: "Every BPod must have a submit label",
      fix: "Add a 'label' field to your submit object"
    },
    [ErrorCode.BPOD_SUBMIT_ACTION_REQUIRED]: {
      message: "Submit action is required",
      explanation: "Every BPod must have a submit action",
      fix: "Add an 'action' field to your submit object"
    },
    [ErrorCode.BPOD_API_URL_INVALID]: {
      message: "Invalid API URL",
      explanation: "API URL must be a valid HTTPS URL",
      fix: "Use a valid HTTPS URL for your API endpoint"
    },
    [ErrorCode.BPOD_API_METHOD_INVALID]: {
      message: "Invalid API method",
      explanation: "Only GET and POST methods are allowed",
      fix: "Change your API method to 'GET' or 'POST'"
    },
    [ErrorCode.BPOD_API_BODY_TEMPLATE_MISSING_WEBHOOK]: {
      message: "Missing webhook_url in body template",
      explanation: "Body template must include {webhook_url} parameter",
      fix: "Add '{webhook_url}' to your bodyTemplate"
    },
    [ErrorCode.BPOD_INPUT_OPTIONS_REQUIRED]: {
      message: "Input options are required",
      explanation: "Dropdown and radio inputs must have options",
      fix: "Add an 'options' array to your input"
    },

    // File handling errors
    [ErrorCode.FILE_NOT_FOUND]: {
      message: "File not found",
      explanation: "The specified BUI file doesn't exist",
      fix: "Check the file path and make sure the file exists"
    },
    [ErrorCode.FILE_TOO_LARGE]: {
      message: "File too large",
      explanation: "The BUI file exceeds the maximum size limit",
      fix: "Reduce the file size or split into multiple files"
    },
    [ErrorCode.TOO_MANY_FILES]: {
      message: "Too many files",
      explanation: "The project contains too many BUI files",
      fix: "Reduce the number of files or increase the limit"
    },
    [ErrorCode.FILE_READ_ERROR]: {
      message: "File read error",
      explanation: "Unable to read the BUI file",
      fix: "Check file permissions and make sure the file is readable"
    },
    [ErrorCode.INVALID_FILE_PATH]: {
      message: "Invalid file path",
      explanation: "The file path contains invalid characters or is outside allowed directory",
      fix: "Use only valid file names and stay within the project directory"
    },

    // System errors
    [ErrorCode.TIMEOUT_ERROR]: {
      message: "Operation timed out",
      explanation: "The operation took too long to complete",
      fix: "Try again or check your network connection"
    },
    [ErrorCode.MEMORY_ERROR]: {
      message: "Memory error",
      explanation: "Not enough memory to process the BUI file",
      fix: "Close other applications or reduce file size"
    },
    [ErrorCode.UNKNOWN_ERROR]: {
      message: "Unknown error occurred",
      explanation: "An unexpected error occurred during processing",
      fix: "Check your BUI file and try again"
    }
  };

  return errorMessages[code] || {
    message: "Unknown error",
    explanation: "An unknown error occurred",
    fix: "Check your BUI file and try again"
  };
}

/**
 * Get user-friendly warning message with explanation
 */
export function getWarningMessage(code: WarningCode): { message: string; explanation: string; fix: string } {
  const warningMessages: Record<WarningCode, { message: string; explanation: string; fix: string }> = {
    // Parsing warnings
    [WarningCode.DEPRECATED_SYNTAX]: {
      message: "Deprecated syntax used",
      explanation: "This syntax is deprecated and may not work in future versions",
      fix: "Update to the current syntax format"
    },
    [WarningCode.UNUSED_INPUT]: {
      message: "Unused input field",
      explanation: "An input field is defined but not used in the API",
      fix: "Remove unused inputs or add them to your bodyTemplate"
    },
    [WarningCode.MISSING_DESCRIPTION]: {
      message: "Missing description",
      explanation: "A BPod is missing a description",
      fix: "Add a description to help users understand the service"
    },

    // Validation warnings
    [WarningCode.PROFILE_MISSING_LOGO]: {
      message: "Profile missing logo",
      explanation: "Profile doesn't have a logo URL",
      fix: "Add a logo URL to make your profile more professional"
    },
    [WarningCode.PROFILE_MISSING_WEBSITE]: {
      message: "Profile missing website",
      explanation: "Profile doesn't have a website URL",
      fix: "Add a website URL to provide more information"
    },
    [WarningCode.BPOD_MISSING_DESCRIPTION]: {
      message: "BPod missing description",
      explanation: "BPod doesn't have a description",
      fix: "Add a description to help users understand the service"
    },
    [WarningCode.BPOD_MISSING_TAGS]: {
      message: "BPod missing tags",
      explanation: "BPod doesn't have tags",
      fix: "Add tags to help categorize your service"
    },
    [WarningCode.API_MISSING_HEADERS]: {
      message: "API missing custom headers",
      explanation: "API doesn't have custom headers configured",
      fix: "Add headers if your API requires authentication"
    },
    [WarningCode.API_MISSING_TIMEOUT]: {
      message: "API missing timeout configuration",
      explanation: "API doesn't have a timeout configured",
      fix: "Add a timeout to prevent hanging requests"
    }
  };

  return warningMessages[code] || {
    message: "Unknown warning",
    explanation: "An unknown warning occurred",
    fix: "Check your BUI file configuration"
  };
}

/**
 * Create a standardized compiler error with comprehensive context
 */
export function createError(
  code: ErrorCode,
  message: string,
  context: ParseContext,
  suggestion?: string,
  severity: "error" | "warning" = "error"
): CompilerError {
  const { line, column } = calculateLineColumn(context);
  
  return {
    message,
    line,
    column,
    severity,
    code,
    file: context.filePath,
    context: extractContext(context.content, context.currentLine, 3),
    suggestion
  };
}

/**
 * Create a compiler warning
 */
export function createWarning(
  code: WarningCode,
  message: string,
  context: ParseContext,
  suggestion?: string
): CompilerWarning {
  const { line, column } = calculateLineColumn(context);
  
  return {
    message,
    line,
    column,
    severity: "warning",
    code,
    file: context.filePath,
    context: extractContext(context.content, context.currentLine, 2),
    suggestion
  };
}

/**
 * Calculate line and column from parse context
 */
function calculateLineColumn(context: ParseContext): { line: number; column: number } {
  return {
    line: context.currentLine + context.lineOffset,
    column: context.currentColumn
  };
}

/**
 * Extract context around a specific line for better error reporting
 */
function extractContext(content: string, targetLine: number, contextLines: number): string {
  const lines = content.split('\n');
  const start = Math.max(0, targetLine - contextLines - 1);
  const end = Math.min(lines.length, targetLine + contextLines);
  
  const contextLines_ = lines.slice(start, end);
  
  return contextLines_.map((line, i) => {
    const lineNum = start + i + 1;
    const marker = lineNum === targetLine ? '>' : ' ';
    return `${marker} ${lineNum.toString().padStart(3)}: ${line}`;
  }).join('\n');
}

/**
 * Create a parse context for error tracking
 */
export function createParseContext(
  filePath: string,
  content: string,
  lineOffset: number = 0
): ParseContext {
  return {
    filePath,
    content,
    lineOffset,
    currentLine: 1,
    currentColumn: 1
  };
}

/**
 * Update parse context position
 */
export function updateParseContext(
  context: ParseContext,
  newLine: number,
  newColumn: number
): ParseContext {
  return {
    ...context,
    currentLine: newLine,
    currentColumn: newColumn
  };
}

/**
 * Create a tokenized error for better debugging
 */
export function createTokenError(
  token: Token,
  expectedType: string,
  context: ParseContext
): CompilerError {
  return createError(
    ErrorCode.INVALID_SYNTAX,
    `Expected ${expectedType}, got ${token.type} at line ${token.line}`,
    context,
    `Check the syntax around line ${token.line}. Expected format: ${expectedType}: ...`
  );
}

/**
 * Format error for console output
 */
export function formatError(error: CompilerError): string {
  const fileInfo = error.file ? ` in ${error.file}` : '';
  const lineCol = error.line > 0 ? ` at line ${error.line}, column ${error.column}` : '';
  const context = error.context ? `\nContext:\n${error.context}` : '';
  
  // Get user-friendly error message
  const friendlyError = getErrorMessage(error.code as ErrorCode);
  const explanation = friendlyError.explanation ? `\n💡 ${friendlyError.explanation}` : '';
  const fix = friendlyError.fix ? `\n🔧 Fix: ${friendlyError.fix}` : '';
  const suggestion = error.suggestion ? `\n💭 Tip: ${error.suggestion}` : '';
  
  return `❌ ${error.code}${fileInfo}${lineCol}: ${error.message}${explanation}${fix}${suggestion}${context}`;
}

/**
 * Format warning for console output
 */
export function formatWarning(warning: CompilerWarning): string {
  const fileInfo = warning.file ? ` in ${warning.file}` : '';
  const lineCol = warning.line > 0 ? ` at line ${warning.line}, column ${warning.column}` : '';
  const context = warning.context ? `\nContext:\n${warning.context}` : '';
  
  // Get user-friendly warning message
  const friendlyWarning = getWarningMessage(warning.code as WarningCode);
  const explanation = friendlyWarning.explanation ? `\n💡 ${friendlyWarning.explanation}` : '';
  const fix = friendlyWarning.fix ? `\n🔧 Fix: ${friendlyWarning.fix}` : '';
  
  return `⚠️  ${warning.code}${fileInfo}${lineCol}: ${warning.message}${explanation}${fix}${context}`;
}

/**
 * Group errors by file for better organization
 */
export function groupErrorsByFile(errors: CompilerError[]): Record<string, CompilerError[]> {
  return errors.reduce((acc, error) => {
    const file = error.file || 'unknown';
    if (!acc[file]) acc[file] = [];
    acc[file].push(error);
    return acc;
  }, {} as Record<string, CompilerError[]>);
}

/**
 * Check if errors contain critical issues
 */
export function hasCriticalErrors(errors: CompilerError[]): boolean {
  return errors.some(error => error.severity === 'error');
}

/**
 * Get error summary statistics
 */
export function getErrorStats(errors: CompilerError[], warnings: CompilerWarning[]) {
  const errorCount = errors.length;
  const warningCount = warnings.length;
  const criticalCount = errors.filter(e => e.severity === 'error').length;
  
  return {
    total: errorCount + warningCount,
    errors: errorCount,
    warnings: warningCount,
    critical: criticalCount,
    success: criticalCount === 0
  };
}
