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
}

export interface BPodSubmit {
  label: string;
  action: string;
}

export interface BPodApi {
  url: string;
  method: "GET" | "POST";
  fileParams: string[];
  bodyTemplate: Record<string, string>;
  responseType: "file" | "json";
}

export interface BPod {
  name: string;
  accepts: string[];
  inputs?: BPodInput[];
  submit: BPodSubmit;
  api: BPodApi;
}

export interface CompileOptions {
  withMetadata?: boolean;
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
  };
  errors: CompilerError[];
}

export interface CompilerError {
  message: string;
  line: number;
  column: number;
  severity: "error" | "warning";
}
