export interface Profile {
  name: string;
  logo?: string;
  description: string;
  website?: string;
  contact?: string;
}

export interface BPodInput {
  name: string;
  type:
    | "text"
    | "textarea"
    | "number"
    | "checkbox"
    | "radio"
    | "dropdown"
    | "toggle"
    | "hidden";
  label?: string;
  options?: string[];
  required?: boolean;
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface BPodSubmit {
  label: string;
  action: string;
  disabled?: boolean;
  loading?: boolean;
}

export interface BPodApi {
  url: string;
  method: "GET" | "POST";
  fileParams: string[];
  bodyTemplate: Record<string, string>;
  responseType: "file" | "json";
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export interface BPod {
  name: string;
  accepts: string[];
  inputs?: BPodInput[];
  submit: BPodSubmit;
  api: BPodApi;
  description?: string;
  tags?: string[];
  version?: string;
}

export interface CompileOptions {
  withMetadata?: boolean;
  strict?: boolean;
  allowWarnings?: boolean;
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  validateUrls?: boolean;
  timeout?: number; // in milliseconds
  content?: string; // Direct content for parsing without file system
}

export interface CompileResult {
  ast: {
    version: string;
    profile?: Profile;
    bPods: BPod[];
  };
  metadata?: {
    includedFiles: string[];
    bPodFileMap: Record<string, string>;
    parseTime: number;
    totalSize: number;
    warnings: CompilerWarning[];
  };
  errors: CompilerError[];
  warnings: CompilerWarning[];
  success: boolean;
}

export interface CompilerError {
  message: string;
  line: number;
  column: number;
  severity: "error" | "warning";
  code: string;
  file?: string;
  context?: string;
  suggestion?: string;
}

export interface CompilerWarning extends Omit<CompilerError, 'severity'> {
  severity: "warning";
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: {
    issues: ValidationIssue[];
    message: string;
  };
}

export interface ValidationIssue {
  message: string;
  path: string[];
  code: string;
  received: any;
  expected?: any;
}

export interface ParseContext {
  filePath: string;
  content: string;
  lineOffset: number;
  currentLine: number;
  currentColumn: number;
}

export interface Token {
  type: 'version' | 'profile' | 'bpod' | 'files' | 'separator';
  value: string;
  line: number;
  column: number;
  raw: string;
}

export interface CompilerStats {
  totalFiles: number;
  totalBPods: number;
  parseTime: number;
  validationTime: number;
  totalErrors: number;
  totalWarnings: number;
  fileSizes: Record<string, number>;
}
