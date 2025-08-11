import { ConvexError } from "convex/values";
/**
 * Create and throw a standardized ConvexError
 *
 * @param code - Error code
 * @param message - Human-readable error message
 * @param details - Optional additional error details
 * @throws ConvexError with standardized format
 */
export function throwError(code, message, details) {
    throw new ConvexError({ code, message, details });
}
/**
 * Unauthorized error - user is not authenticated
 */
export function throwUnauthorized(message = "Authentication required") {
    return throwError("unauthorized", message);
}
/**
 * Forbidden error - user doesn't have permission
 */
export function throwForbidden(message = "You don't have permission to perform this action", permissionKey) {
    const details = permissionKey ? { permissionKey } : undefined;
    return throwError("forbidden", message, details);
}
/**
 * Not found error - resource doesn't exist
 */
export function throwNotFound(resourceType, identifier) {
    const message = identifier
        ? `${resourceType} not found: ${typeof identifier === "string" ? identifier : JSON.stringify(identifier)}`
        : `${resourceType} not found`;
    const details = typeof identifier === "object" ? identifier : undefined;
    return throwError("not_found", message, details);
}
/**
 * Conflict error - resource already exists or constraint violation
 */
export function throwConflict(message, details) {
    return throwError("conflict", message, details);
}
/**
 * Invalid input error - validation failed
 */
export function throwInvalidInput(message, validationErrors) {
    return throwError("invalid_input", message, {
        validationErrors: JSON.stringify(validationErrors),
    });
}
/**
 * Internal error - unexpected server error
 */
export function throwInternal(message = "An unexpected error occurred", error) {
    // In development, include the original error details
    // In production, you might want to sanitize this
    const errorString = error ? JSON.stringify(error) : null;
    const details = { originalError: errorString };
    return throwError("internal", message, details);
}
/**
 * Rate limited error - too many requests
 */
export function throwRateLimited(message = "Too many requests, please try again later") {
    return throwError("rate_limited", message);
}
/**
 * Service unavailable error - external dependency unavailable
 */
export function throwServiceUnavailable(service, message) {
    return throwError("service_unavailable", message ?? `Service unavailable: ${service}`);
}
/**
 * Not implemented error - feature not available
 */
export function throwNotImplemented(feature) {
    return throwError("not_implemented", `Feature not implemented: ${feature}`);
}
/**
 * Safe wrapper for async operations that might throw
 *
 * @param operation - Async operation to execute
 * @param errorHandler - Function to handle errors
 * @returns Result of the operation or result of error handler
 */
export async function tryCatch(operation, errorHandler) {
    try {
        return await operation();
    }
    catch (error) {
        return errorHandler(error);
    }
}
/**
 * Assert that a condition is true, throw an error if not
 *
 * @param condition - Condition to check
 * @param errorFn - Function to create and throw an error
 */
export function assert(condition, errorFn) {
    if (!condition) {
        errorFn();
    }
}
/**
 * Check if an error is a ConvexError with a specific code
 *
 * @param error - Error to check
 * @param code - Error code to match
 * @returns True if the error matches the code
 */
export function isErrorCode(error, code) {
    return (error instanceof ConvexError &&
        typeof error.data === "object" &&
        error.data !== null &&
        "code" in error.data &&
        error.data.code === code);
}
/**
 * Extract useful information from an unknown error
 *
 * @param error - Unknown error object
 * @returns Formatted error information
 */
export function formatError(error) {
    if (error instanceof ConvexError &&
        typeof error.data === "object" &&
        error.data !== null) {
        // Extract information from ConvexError
        const data = error.data;
        return {
            code: typeof data.code === "string" && isValidErrorCode(data.code)
                ? data.code
                : "internal",
            message: data.message ?? error.message ?? "Unknown error",
            details: data.details,
        };
    }
    else if (error instanceof Error) {
        // Format standard Error object
        return {
            code: "internal",
            message: error.message || "Unknown error",
            details: {
                name: error.name,
                stack: error.stack ?? null,
            },
        };
    }
    else {
        // Handle non-Error objects
        return {
            code: "internal",
            message: String(error) || "Unknown error",
        };
    }
}
/**
 * Check if a string is a valid ErrorCode
 */
function isValidErrorCode(code) {
    return [
        "unauthorized",
        "forbidden",
        "not_found",
        "conflict",
        "invalid_input",
        "rate_limited",
        "internal",
        "service_unavailable",
        "not_implemented",
    ].includes(code);
}
/**
 * Log an error with context information
 *
 * @param error - Error to log
 * @param context - Additional context information
 */
export function logError(error, context) {
    const formattedError = formatError(error);
    // In a real app, you might want to send this to a logging service
    console.error("Error:", formattedError, "Context:", context);
}
