import { ConvexError } from "convex/values";

/**
 * Custom error codes for the Email Parser application
 */
export enum ErrorCode {
  // Authentication errors
  UNAUTHENTICATED = "UNAUTHENTICATED",
  UNAUTHORIZED = "UNAUTHORIZED",

  // Resource errors
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",

  // Validation errors
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_FIELD = "MISSING_FIELD",

  // Operation errors
  OPERATION_FAILED = "OPERATION_FAILED",

  // System errors
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

/**
 * Extended ConvexError with additional properties
 */
export class EmailParserError extends ConvexError {
  code: ErrorCode;
  data?: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCode,
    data?: Record<string, unknown>,
  ) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

/**
 * Create an authentication error when a user is not logged in
 */
export function createUnauthenticatedError(): EmailParserError {
  return new EmailParserError(
    "Authentication required. Please log in to continue.",
    ErrorCode.UNAUTHENTICATED,
  );
}

/**
 * Create an authorization error when a user doesn't have permission
 * @param resource The type of resource being accessed
 * @param action The action being attempted
 */
export function createUnauthorizedError(
  resource: string,
  action: string,
): EmailParserError {
  return new EmailParserError(
    `You don't have permission to ${action} this ${resource}.`,
    ErrorCode.UNAUTHORIZED,
    { resource, action },
  );
}

/**
 * Create a not found error when a resource doesn't exist
 * @param resource The type of resource
 * @param id The ID of the resource
 */
export function createNotFoundError(
  resource: string,
  id: string,
): EmailParserError {
  return new EmailParserError(
    `${resource} with ID ${id} not found.`,
    ErrorCode.NOT_FOUND,
    { resource, id },
  );
}

/**
 * Create an already exists error when trying to create a duplicate resource
 * @param resource The type of resource
 * @param field The field that must be unique
 * @param value The value that already exists
 */
export function createAlreadyExistsError(
  resource: string,
  field: string,
  value: string,
): EmailParserError {
  return new EmailParserError(
    `${resource} with ${field} "${value}" already exists.`,
    ErrorCode.ALREADY_EXISTS,
    { resource, field, value },
  );
}

/**
 * Create an invalid input error when input validation fails
 * @param message The validation error message
 * @param invalidFields Object containing field names and error messages
 */
export function createInvalidInputError(
  message: string,
  invalidFields: Record<string, string>,
): EmailParserError {
  return new EmailParserError(message, ErrorCode.INVALID_INPUT, {
    invalidFields,
  });
}

/**
 * Create a general operation failed error
 * @param operation The operation that failed
 * @param reason The reason for the failure
 */
export function createOperationFailedError(
  operation: string,
  reason: string,
): EmailParserError {
  return new EmailParserError(
    `Operation "${operation}" failed: ${reason}`,
    ErrorCode.OPERATION_FAILED,
    { operation, reason },
  );
}

/**
 * Create an internal error for unexpected exceptions
 * @param message Error message
 * @param originalError The original error
 */
export function createInternalError(
  message: string,
  originalError?: unknown,
): EmailParserError {
  return new EmailParserError(
    `Internal server error: ${message}`,
    ErrorCode.INTERNAL_ERROR,
    originalError ? { originalError } : undefined,
  );
}

/**
 * Wrap a function with error handling
 * @param fn The function to wrap
 * @returns The wrapped function with error handling
 */
export function withErrorHandling<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
): (...args: Args) => Promise<T> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (error) {
      // If it's already an EmailParserError, just re-throw it
      if (error instanceof EmailParserError) {
        throw error;
      }

      // If it's a ConvexError, convert it to an EmailParserError
      if (error instanceof ConvexError) {
        throw new EmailParserError(error.message, ErrorCode.INTERNAL_ERROR);
      }

      // For other errors, wrap them in an internal error
      console.error("Unhandled error:", error);
      throw createInternalError("An unexpected error occurred", error);
    }
  };
}
