// Core compiler functions
export { parseBUI } from "./core/parser";

// Error handling and reporting
export { 
  createError, 
  createWarning, 
  createParseContext, 
  updateParseContext,
  formatError, 
  formatWarning,
  groupErrorsByFile,
  getErrorStats,
  hasCriticalErrors,
  getErrorMessage,
  getWarningMessage,
  ErrorCode,
  WarningCode
} from "./core/error-reporter";

// Validation functions
export { 
  validateProfile, 
  validateBPod, 
  validateFileExtensions, 
  validateApiUrl, 
  validateBodyTemplate 
} from "./core/validator";

// File merging and management
export {
  mergeBuiFiles,
  validateFilePath,
  getFileStats,
  isFileReadable
} from "./core/merger";

// Renderer (Main npm package functions)
export {
  renderBUIString,
  renderBUIContent,
  renderBUI,
  RenderOptions,
  RenderResult
} from "./renderer";

// Types
export * from "./types";

// CLI functionality is available via the built executable
