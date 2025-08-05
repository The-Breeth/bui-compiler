// BPodAPI interface from ast/index.ts (for completeness)
export interface BPodAPI {
  url: string;
  method: 'GET' | 'POST';
  fileParams: string[];
  bodyTemplate: Record<string, string>;
  responseType: 'file' | 'json';
}
export interface Profile {
  version: string;
  name: string;
  logo: string;
  description: string;
  website?: string;
  contact?: string;
}

export interface BPodInput {
  name: string;
  type: 'text' | 'textarea' | 'number' | 'checkbox' | 'radio' | 'dropdown' | 'toggle' | 'hidden' | 'submit';
  label: string;
  options?: string[];
}

export interface BPod {
  name: string;
  accepts: string[];
  inputs: BPodInput[];
  submit: {
    label: string;
    action: string;
  };
  api: {
    url: string;
    method: 'GET' | 'POST';
    fileParams: string[];
    bodyTemplate: Record<string, string>;
    responseType: 'file' | 'json';
  };
}

export interface ValidationError {
  message: string;
  line: number;
  column: number;
  severity: 'error' | 'warning';
}

// For compatibility with compiler entry point
export type CompilerError = ValidationError & { severity: 'error' | 'warning' | 'fatal' };

export interface ParsedAST {
  profile: Profile;
  bPods: BPod[];
}