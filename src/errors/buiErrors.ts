class BuiError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "BuiError";
    }
}

class MissingFieldError extends BuiError {
    constructor(field: string) {
        super(`Missing required field: ${field}`);
        this.name = "MissingFieldError";
    }
}

class InvalidTypeError extends BuiError {
    constructor(field: string, expectedType: string, receivedType: string) {
        super(`Invalid type for field \"${field}\". Expected: ${expectedType}, Received: ${receivedType}`);
        this.name = "InvalidTypeError";
    }
}

class UrlError extends BuiError {
    constructor(url: string) {
        super(`Invalid URL: ${url}. Must be HTTPS.`);
        this.name = "UrlError";
    }
}

class ValidationError extends BuiError {
    constructor(errors: string[]) {
        super(`Validation errors: ${errors.join(", ")}`);
        this.name = "ValidationError";
    }
}

export { BuiError, MissingFieldError, InvalidTypeError, UrlError, ValidationError };
