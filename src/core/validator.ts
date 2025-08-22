import { z } from "zod";
import { Profile, BPod, ValidationResult, ValidationIssue } from "../types";
import { ErrorCode, WarningCode, createError, createWarning, createParseContext } from "./error-reporter";

export const DEFAULT_LOGO = "https://cdn.breeth.com/default-logo.png";

// Enhanced schemas with better error messages
export const profileSchema = z.object({
  name: z.string().min(1, "Profile name is required"),
  logo: z
    .string()
    .url("Logo must be a valid URL")
    .startsWith("https://", "Logo URL must use HTTPS")
    .optional()
    .default(DEFAULT_LOGO),
  description: z.string().max(500, "Description cannot exceed 500 characters"),
  website: z.string().url("Website must be a valid URL").startsWith("https://", "Website must use HTTPS").optional(),
  contact: z.string().optional(),
});

const inputSchema = z
  .object({
    name: z.string().min(1, "Input name is required"),
    type: z.enum([
      "text",
      "textarea",
      "number",
      "checkbox",
      "radio",
      "dropdown",
      "toggle",
      "hidden",
    ]),
    label: z.string().optional(),
    options: z.array(z.string()).optional(),
    required: z.boolean().optional(),
    placeholder: z.string().optional(),
    validation: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
      message: z.string().optional(),
    }).optional(),
  })
  .refine(
    (data) => {
      if (
        (data.type === "radio" || data.type === "dropdown") &&
        (!data.options || data.options.length === 0)
      ) {
        return false;
      }
      return true;
    },
    { message: "Radio and dropdown inputs require options" }
  )
  .refine(
    (data) => {
      if (data.type === "number" && data.validation) {
        const { min, max } = data.validation;
        if (min !== undefined && max !== undefined && min > max) {
          return false;
        }
      }
      return true;
    },
    { message: "Min value cannot be greater than max value" }
  );

const apiSchema = z
  .object({
    url: z
      .string()
      .url("API URL must be a valid URL")
      .startsWith("https://", "API URL must start with https://"),
    method: z.enum(["GET", "POST"]),
    fileParams: z.array(z.string()).min(1, "At least one file parameter is required"),
    bodyTemplate: z.record(z.string(), z.string()),
    responseType: z.enum(["file", "json"]),
    headers: z.record(z.string(), z.string()).optional(),
    timeout: z.number().positive("Timeout must be positive").optional(),
    retries: z.number().int().min(0, "Retries must be non-negative").max(5, "Retries cannot exceed 5").optional(),
  })
  .refine(
    (data) => {
      return Object.values(data.bodyTemplate).some(value => value.includes("{webhook_url}"));
    },
    { message: "Body template must include {webhook_url} parameter" }
  )
  .refine(
    (data) => {
      if (data.method === "GET" && Object.keys(data.bodyTemplate).length > 0) {
        return false;
      }
      return true;
    },
    { message: "GET requests cannot have a body template" }
  );

export const bPodSchema = z.object({
  name: z.string().min(1, "BPod name is required"),
  accepts: z
    .array(
      z
        .string()
        .regex(/^[a-z0-9]+$/, "File extension must be lowercase without dot")
    )
    .nonempty("At least one file type must be accepted"),
  inputs: z.array(inputSchema).optional(),
  submit: z.object({
    label: z.string().min(1, "Submit label is required"),
    action: z.string().min(1, "Submit action is required"),
    disabled: z.boolean().optional(),
    loading: z.boolean().optional(),
  }),
  api: apiSchema,
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  version: z.string().optional(),
});

export function validateProfile(profile: Profile): ValidationResult<Profile> {
  const parsed = profileSchema.safeParse(profile);
  
  if (parsed.success) {
    // Apply defaults
    if (!parsed.data.logo) parsed.data.logo = DEFAULT_LOGO;
    
    // Check for warnings
    const warnings: ValidationIssue[] = [];
    if (!parsed.data.logo || parsed.data.logo === DEFAULT_LOGO) {
      warnings.push({
        message: "Profile is missing a custom logo",
        path: ["logo"],
        code: WarningCode.PROFILE_MISSING_LOGO,
        received: parsed.data.logo,
        expected: "Custom logo URL"
      });
    }
    
    if (!parsed.data.website) {
      warnings.push({
        message: "Profile is missing a website URL",
        path: ["website"],
        code: WarningCode.PROFILE_MISSING_WEBSITE,
        received: undefined,
        expected: "Website URL"
      });
    }
    
    return {
      success: true,
      data: parsed.data,
      error: warnings.length > 0 ? { issues: warnings, message: "Profile has warnings" } : undefined
    };
  }
  
  return {
    success: false,
    error: {
      issues: parsed.error.issues.map(issue => {
        // Map specific validation failures to correct error codes
        let errorCode = mapZodErrorToCode(issue.code);
        
        // Override based on the field being validated
        if (issue.path.includes('name') && (String(issue.code) === 'missing' || String(issue.code) === 'invalid_type')) {
          errorCode = ErrorCode.PROFILE_NAME_REQUIRED;
        } else if (issue.path.includes('logo') && String(issue.code) === 'invalid_string') {
          errorCode = ErrorCode.INVALID_LOGO_URL;
        } else if (issue.path.includes('website') && String(issue.code) === 'invalid_string') {
          errorCode = ErrorCode.INVALID_WEBSITE_URL;
        }
        

        
        return {
          message: issue.message,
          path: issue.path.map(p => String(p)),
          code: errorCode,
          received: (issue as any).received || undefined,
          expected: undefined
        };
      }),
      message: "Profile validation failed"
    }
  };
}

export function validateBPod(bPod: BPod): ValidationResult<BPod> {
  const parsed = bPodSchema.safeParse(bPod);
  
  if (parsed.success) {
    // Check for warnings
    const warnings: ValidationIssue[] = [];
    
    if (!parsed.data.description) {
      warnings.push({
        message: "BPod is missing a description",
        path: ["description"],
        code: WarningCode.BPOD_MISSING_DESCRIPTION,
        received: undefined,
        expected: "Description string"
      });
    }
    
    if (!parsed.data.tags || parsed.data.tags.length === 0) {
      warnings.push({
        message: "BPod is missing tags",
        path: ["tags"],
        code: WarningCode.BPOD_MISSING_TAGS,
        received: parsed.data.tags,
        expected: "Array of tag strings"
      });
    }
    
    if (!parsed.data.api.headers || Object.keys(parsed.data.api.headers).length === 0) {
      warnings.push({
        message: "API is missing custom headers",
        path: ["api", "headers"],
        code: WarningCode.API_MISSING_HEADERS,
        received: parsed.data.api.headers,
        expected: "Custom headers object"
      });
    }
    
    if (!parsed.data.api.timeout) {
      warnings.push({
        message: "API is missing timeout configuration",
        path: ["api", "timeout"],
        code: WarningCode.API_MISSING_TIMEOUT,
        received: parsed.data.api.timeout,
        expected: "Timeout in milliseconds"
      });
    }
    
    return {
      success: true,
      data: parsed.data,
      error: warnings.length > 0 ? { issues: warnings, message: "BPod has warnings" } : undefined
    };
  }
  
  return {
    success: false,
    error: {
      issues: parsed.error.issues.map(issue => {
        // Map specific validation failures to correct error codes
        let errorCode = mapZodErrorToCode(issue.code);
        
        // Override based on the field being validated
        if (issue.path.includes('name') && (String(issue.code) === 'missing' || String(issue.code) === 'invalid_type')) {
          errorCode = ErrorCode.BPOD_NAME_REQUIRED;
        } else if (issue.path.includes('accepts') && String(issue.code) === 'too_small') {
          errorCode = ErrorCode.BPOD_ACCEPTS_EMPTY;
        } else if (issue.path.includes('api') && issue.path.includes('url') && String(issue.code) === 'invalid_string') {
          errorCode = ErrorCode.BPOD_API_URL_INVALID;
        }
        
        return {
          message: issue.message,
          path: issue.path.map(p => String(p)),
          code: errorCode,
          received: (issue as any).received || undefined,
          expected: undefined
        };
      }),
      message: "BPod validation failed"
    }
  };
}

/**
 * Map Zod error codes to our custom error codes
 */
function mapZodErrorToCode(zodCode: string): string {
  const codeMap: Record<string, string> = {
    "invalid_string": "E102",
    "invalid_url": "E103",
    "too_big": "E102",
    "too_small": "E201",
    "invalid_enum_value": "E207",
    "invalid_regex": "E203",
    "invalid_type": "E001",
    "missing": "E201",
    "unrecognized_keys": "E001",
    "invalid_union": "E001",
    "invalid_arguments": "E001",
    "invalid_return_type": "E001",
    "invalid_date": "E001",
    "custom": "E001",
    "invalid_literal": "E001",
    "invalid_intersection_types": "E001",
    "not_multiple_of": "E001",
    "not_finite": "E001"
  };
  
  return codeMap[zodCode] || "E001";
}

/**
 * Validate file extensions format
 */
export function validateFileExtensions(extensions: string[]): ValidationResult<string[]> {
  const invalidExtensions = extensions.filter(ext => !/^[a-z0-9]+$/.test(ext));
  
  if (invalidExtensions.length > 0) {
    return {
      success: false,
      error: {
        issues: [{
          message: `Invalid file extensions: ${invalidExtensions.join(", ")}`,
          path: ["accepts"],
          code: ErrorCode.BPOD_ACCEPTS_INVALID_FORMAT,
          received: invalidExtensions,
          expected: "Lowercase alphanumeric extensions without dots"
        }],
        message: "File extension validation failed"
      }
    };
  }
  
  return { success: true, data: extensions };
}

/**
 * Validate API URL format and accessibility
 */
export async function validateApiUrl(url: string, options: { validateUrls?: boolean; timeout?: number } = {}): Promise<ValidationResult<string>> {
  if (!options.validateUrls) {
    return { success: true, data: url };
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 5000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors' // Avoid CORS issues
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok || response.status === 0) { // status 0 for no-cors
      return { success: true, data: url };
    } else {
      return {
        success: false,
        error: {
          issues: [{
            message: `API URL returned status ${response.status}`,
            path: ["api", "url"],
            code: ErrorCode.BPOD_API_URL_INVALID,
            received: response.status,
            expected: "Successful response (2xx)"
          }],
          message: "API URL validation failed"
        }
      };
    }
  } catch (error) {
    return {
      success: false,
      error: {
        issues: [{
          message: `Failed to validate API URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
          path: ["api", "url"],
          code: ErrorCode.BPOD_API_URL_INVALID,
          received: error,
          expected: "Accessible URL"
        }],
        message: "API URL validation failed"
      }
    };
  }
}

/**
 * Validate body template parameters
 */
export function validateBodyTemplate(template: Record<string, string>, fileParams: string[]): ValidationResult<Record<string, string>> {
  const requiredParams = ["{webhook_url}", ...fileParams.map(p => `{${p}}`)];
  const missingParams = requiredParams.filter(param => 
    !Object.values(template).some(value => value.includes(param))
  );
  
  if (missingParams.length > 0) {
    return {
      success: false,
      error: {
        issues: [{
          message: `Missing required parameters in body template: ${missingParams.join(", ")}`,
          path: ["api", "bodyTemplate"],
          code: ErrorCode.BPOD_API_BODY_TEMPLATE_MISSING_WEBHOOK,
          received: Object.keys(template),
          expected: requiredParams
        }],
        message: "Body template validation failed"
      }
    };
  }
  
  return { success: true, data: template };
}
