import { ParsedAST, ValidationError, BPod, BPodInput } from '../types';
import { isValidURL, isNonEmptyArray, isValidEmail } from '../utils';

export function validateAST(ast: ParsedAST): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate profile
    const { profile, bPods } = ast;

    if (!profile) {
        errors.push({ message: 'Profile is missing', line: 1, column: 1, severity: 'error' });
        return errors;
    }

    if (!profile.version || profile.version !== '1.0.0') {
        errors.push({ message: 'Invalid or missing version in profile', line: 1, column: 1, severity: 'error' });
    }

    if (!profile.name) {
        errors.push({ message: 'Missing required field "name" in profile', line: 1, column: 1, severity: 'error' });
    }

    if (!profile.logo || !isValidURL(profile.logo)) {
        errors.push({ message: 'Invalid or missing logo URL in profile', line: 1, column: 1, severity: 'error' });
    }

    if (!profile.description || profile.description.length > 250) {
        errors.push({ message: 'Missing or too long "description" in profile', line: 1, column: 1, severity: 'error' });
    }

    if (profile.website && !isValidURL(profile.website)) {
        errors.push({ message: 'Invalid website URL in profile', line: 1, column: 1, severity: 'warning' });
    }

    if (profile.contact && !(isValidURL(profile.contact) || isValidEmail(profile.contact))) {
        errors.push({ message: 'Invalid contact in profile', line: 1, column: 1, severity: 'warning' });
    }

    // Validate bPods
    if (!isNonEmptyArray(bPods)) {
        errors.push({ message: 'No bPods defined', line: 1, column: 1, severity: 'error' });
        return errors;
    }

    const bPodNames = new Set<string>();

    bPods.forEach((bPod: BPod) => {
        if (!bPod.name) {
            errors.push({ message: 'B-Pod name is missing', line: 1, column: 1, severity: 'error' });
        } else if (bPodNames.has(bPod.name)) {
            errors.push({ message: `Duplicate B-Pod name "${bPod.name}"`, line: 1, column: 1, severity: 'error' });
        } else {
            bPodNames.add(bPod.name);
        }

        if (!isNonEmptyArray(bPod.accepts)) {
            errors.push({ message: `B-Pod "${bPod.name}" must define accepted file types`, line: 1, column: 1, severity: 'error' });
        }

        if (!isNonEmptyArray(bPod.inputs)) {
            errors.push({ message: `B-Pod "${bPod.name}" must define inputs`, line: 1, column: 1, severity: 'error' });
        }

        // Validate each input
        if (Array.isArray(bPod.inputs)) {
            bPod.inputs.forEach((input: BPodInput, idx: number) => {
                const allowedTypes = ['text', 'textarea', 'number', 'checkbox', 'radio', 'dropdown', 'toggle', 'hidden', 'submit'];
                if (!allowedTypes.includes(input.type)) {
                    errors.push({
                        message: `Invalid type "${input.type}" in inputs[${idx}] — did you mean one of: ${allowedTypes.join(', ')}?`,
                        line: 1,
                        column: 1,
                        severity: 'error',
                    });
                }
                if ((input.type === 'radio' || input.type === 'dropdown') && !isNonEmptyArray(input.options)) {
                    errors.push({
                        message: `Input "${input.name}" of type "${input.type}" must have non-empty options array`,
                        line: 1,
                        column: 1,
                        severity: 'error',
                    });
                }
            });
        }

        if (!bPod.submit || !bPod.submit.label || !bPod.submit.action) {
            errors.push({ message: `B-Pod "${bPod.name}" must define submit with label and action`, line: 1, column: 1, severity: 'error' });
        }

        if (!bPod.api || !bPod.api.url || !isValidURL(bPod.api.url)) {
            errors.push({ message: `B-Pod "${bPod.name}" must define a valid API URL`, line: 1, column: 1, severity: 'error' });
        }

        if (!bPod.api.bodyTemplate || typeof bPod.api.bodyTemplate !== 'object') {
            errors.push({ message: `B-Pod "${bPod.name}" must define a valid bodyTemplate`, line: 1, column: 1, severity: 'error' });
        } else if (!('webhook_url' in bPod.api.bodyTemplate)) {
            errors.push({ message: `B-Pod "${bPod.name}" bodyTemplate must include {webhook_url}`, line: 1, column: 1, severity: 'error' });
        }

        if (!['file', 'json'].includes(bPod.api.responseType)) {
            errors.push({ message: `B-Pod "${bPod.name}" api.responseType must be "file" or "json"`, line: 1, column: 1, severity: 'error' });
        }
    });

    return errors;
}

// Alias for compiler entry point compatibility
export const validateBuiAst = validateAST;
