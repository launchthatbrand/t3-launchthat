import type { ActionResult } from "./registries";

/**
 * Standardized error codes for the integrations system
 */
export enum ErrorCode {
  // Authentication errors (usually fatal)
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  UNAUTHORIZED = "UNAUTHORIZED",

  // Rate limiting (retryable)
  RATE_LIMITED = "RATE_LIMITED",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",

  // Validation errors (usually fatal)
  INVALID_INPUT = "INVALID_INPUT",
  INVALID_CONFIG = "INVALID_CONFIG",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",

  // External service errors (retryable)
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  TIMEOUT = "TIMEOUT",
  NETWORK_ERROR = "NETWORK_ERROR",
  HTTP_ERROR = "HTTP_ERROR",

  // Connection errors (retryable)
  CONNECTION_NOT_FOUND = "CONNECTION_NOT_FOUND",
  CONNECTION_INVALID = "CONNECTION_INVALID",

  // Execution errors
  EXECUTION_FAILED = "EXECUTION_FAILED",
  MAX_RETRIES_EXCEEDED = "MAX_RETRIES_EXCEEDED",
  IDEMPOTENCY_CONFLICT = "IDEMPOTENCY_CONFLICT",

  // Node/Action specific
  NODE_NOT_FOUND = "NODE_NOT_FOUND",
  ACTION_NOT_FOUND = "ACTION_NOT_FOUND",
  INVALID_NODE_CONFIG = "INVALID_NODE_CONFIG",
  NOT_FOUND = "NOT_FOUND",

  // Migration errors
  MIGRATION_NOT_SUPPORTED = "MIGRATION_NOT_SUPPORTED",
  MIGRATION_FAILED = "MIGRATION_FAILED",

  // Internal errors
  INTERNAL_ERROR = "INTERNAL_ERROR",

  // Unexpected errors (retryable by default)
  UNEXPECTED_ERROR = "UNEXPECTED_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Helper to determine if an error code is retryable by default
 */
export function isRetryableError(code: ErrorCode): boolean {
  const retryableErrors: ErrorCode[] = [
    ErrorCode.RATE_LIMITED,
    ErrorCode.QUOTA_EXCEEDED,
    ErrorCode.SERVICE_UNAVAILABLE,
    ErrorCode.TIMEOUT,
    ErrorCode.NETWORK_ERROR,
    ErrorCode.HTTP_ERROR,
    ErrorCode.CONNECTION_NOT_FOUND,
    ErrorCode.CONNECTION_INVALID,
    ErrorCode.EXECUTION_FAILED,
    ErrorCode.UNEXPECTED_ERROR,
    ErrorCode.UNKNOWN_ERROR,
  ];

  return retryableErrors.includes(code);
}

/**
 * Helper to create standardized error results
 */
export function createError<T>(
  code: ErrorCode,
  message: string,
  retryable?: boolean,
): ActionResult<T> {
  const shouldRetry = retryable ?? isRetryableError(code);

  return {
    kind: shouldRetry ? "retryable_error" : "fatal_error",
    error: {
      code,
      message,
    },
  };
}

/**
 * Helper to create success results
 */
export function createSuccess<T>(data: T): ActionResult<T> {
  return {
    kind: "success",
    data,
  };
}

/**
 * Helper to wrap exceptions into standardized error results
 */
export function wrapException<T>(
  error: unknown,
  fallbackCode = ErrorCode.UNEXPECTED_ERROR,
): ActionResult<T> {
  if (error instanceof Error) {
    // Try to extract meaningful error codes from common error patterns
    const message = error.message.toLowerCase();

    if (message.includes("timeout") || message.includes("timed out")) {
      return createError(ErrorCode.TIMEOUT, error.message);
    }

    if (
      message.includes("network") ||
      message.includes("enotfound") ||
      message.includes("econnrefused")
    ) {
      return createError(ErrorCode.NETWORK_ERROR, error.message);
    }

    if (message.includes("unauthorized") || message.includes("401")) {
      return createError(ErrorCode.UNAUTHORIZED, error.message, false);
    }

    if (message.includes("forbidden") || message.includes("403")) {
      return createError(ErrorCode.UNAUTHORIZED, error.message, false);
    }

    if (message.includes("rate limit") || message.includes("429")) {
      return createError(ErrorCode.RATE_LIMITED, error.message);
    }

    if (message.includes("quota") || message.includes("limit exceeded")) {
      return createError(ErrorCode.QUOTA_EXCEEDED, error.message);
    }

    return createError(fallbackCode, error.message);
  }

  return createError(fallbackCode, String(error));
}

/**
 * Error context for tracking error details across retries
 */
export interface ErrorContext {
  totalAttempts: number;
  lastError?: {
    code: string;
    message: string;
    timestamp: number;
  };
  firstErrorTimestamp?: number;
}

/**
 * Helper to update error context during retries
 */
export function updateErrorContext(
  context: ErrorContext | undefined,
  error: { code: string; message: string },
): ErrorContext {
  const now = Date.now();

  if (!context) {
    return {
      totalAttempts: 1,
      lastError: {
        ...error,
        timestamp: now,
      },
      firstErrorTimestamp: now,
    };
  }

  return {
    totalAttempts: context.totalAttempts + 1,
    lastError: {
      ...error,
      timestamp: now,
    },
    firstErrorTimestamp: context.firstErrorTimestamp ?? now,
  };
}
