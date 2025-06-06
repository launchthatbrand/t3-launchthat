/**
 * Error Handling Library for Integration Scenarios
 *
 * This file provides base utilities for classifying errors, implementing retry strategies,
 * and circuit breaker pattern for resilient integration scenarios.
 */

// Error categories for classification
export enum ErrorCategory {
  NETWORK = "network",
  SERVER = "server",
  CLIENT = "client",
  VALIDATION = "validation",
  AUTHORIZATION = "authorization",
  INTEGRATION = "integration",
  TIMEOUT = "timeout",
  UNKNOWN = "unknown",
}

// Error severity levels
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

// Error persistence types
export enum ErrorPersistence {
  TEMPORARY = "temporary",
  INTERMITTENT = "intermittent",
  PERMANENT = "permanent",
}

// Retry strategies
export enum RetryStrategy {
  EXPONENTIAL_BACKOFF = "exponential_backoff",
  FIXED_INTERVAL = "fixed_interval",
  PROGRESSIVE = "progressive",
}

// Configuration for retry strategies
export interface RetryConfig {
  strategy: RetryStrategy;
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor?: number;
  retryableErrors?: ErrorCategory[];
  nonRetryableErrors?: ErrorCategory[];
}

// Default retry configurations
export const DEFAULT_RETRY_CONFIGS: Record<RetryStrategy, RetryConfig> = {
  [RetryStrategy.EXPONENTIAL_BACKOFF]: {
    strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
    maxAttempts: 3,
    initialDelayMs: 1000, // 1 second
    maxDelayMs: 30000, // 30 seconds
    backoffFactor: 2,
    retryableErrors: [
      ErrorCategory.NETWORK,
      ErrorCategory.SERVER,
      ErrorCategory.TIMEOUT,
    ],
    nonRetryableErrors: [ErrorCategory.VALIDATION, ErrorCategory.AUTHORIZATION],
  },
  [RetryStrategy.FIXED_INTERVAL]: {
    strategy: RetryStrategy.FIXED_INTERVAL,
    maxAttempts: 3,
    initialDelayMs: 5000, // 5 seconds
    maxDelayMs: 5000, // same as initial delay
    retryableErrors: [
      ErrorCategory.NETWORK,
      ErrorCategory.SERVER,
      ErrorCategory.TIMEOUT,
    ],
    nonRetryableErrors: [ErrorCategory.VALIDATION, ErrorCategory.AUTHORIZATION],
  },
  [RetryStrategy.PROGRESSIVE]: {
    strategy: RetryStrategy.PROGRESSIVE,
    maxAttempts: 5,
    initialDelayMs: 1000, // 1 second
    maxDelayMs: 60000, // 60 seconds
    backoffFactor: 1.5,
    retryableErrors: [
      ErrorCategory.NETWORK,
      ErrorCategory.SERVER,
      ErrorCategory.TIMEOUT,
      ErrorCategory.INTEGRATION,
    ],
    nonRetryableErrors: [ErrorCategory.VALIDATION],
  },
};

// Error classification result
export interface ErrorClassification {
  category: ErrorCategory;
  severity: ErrorSeverity;
  persistence: ErrorPersistence;
  retryable: boolean;
  message: string;
  details?: Record<string, any>;
}

/**
 * Classify an error based on its properties
 */
export function classifyError(error: unknown): ErrorClassification {
  // Default classification
  const defaultClassification: ErrorClassification = {
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    persistence: ErrorPersistence.INTERMITTENT,
    retryable: true,
    message: error instanceof Error ? error.message : String(error),
  };

  // Handle different error types
  if (error instanceof Error) {
    const errorName = error.name;
    const errorMessage = error.message.toLowerCase();
    const errorStack = error.stack || "";

    // Network errors
    if (
      errorName === "NetworkError" ||
      errorName === "FetchError" ||
      errorMessage.includes("network") ||
      errorMessage.includes("offline") ||
      errorMessage.includes("unreachable") ||
      errorMessage.includes("connection") ||
      errorMessage.includes("socket")
    ) {
      return {
        ...defaultClassification,
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        persistence: ErrorPersistence.TEMPORARY,
        retryable: true,
        message: error.message,
      };
    }

    // Timeout errors
    if (
      errorName === "TimeoutError" ||
      errorMessage.includes("timeout") ||
      errorMessage.includes("timed out")
    ) {
      return {
        ...defaultClassification,
        category: ErrorCategory.TIMEOUT,
        severity: ErrorSeverity.MEDIUM,
        persistence: ErrorPersistence.TEMPORARY,
        retryable: true,
        message: error.message,
      };
    }

    // Authorization errors
    if (
      errorName === "AuthorizationError" ||
      errorName === "AuthenticationError" ||
      errorMessage.includes("unauthorized") ||
      errorMessage.includes("not authorized") ||
      errorMessage.includes("permission") ||
      errorMessage.includes("access denied") ||
      errorMessage.includes("forbidden") ||
      errorMessage.includes("authentication") ||
      errorMessage.includes("token") ||
      errorMessage.includes("credential") ||
      errorMessage.includes("api key")
    ) {
      return {
        ...defaultClassification,
        category: ErrorCategory.AUTHORIZATION,
        severity: ErrorSeverity.HIGH,
        persistence: ErrorPersistence.PERMANENT,
        retryable: false,
        message: error.message,
      };
    }

    // Validation errors
    if (
      errorName === "ValidationError" ||
      errorName === "SyntaxError" ||
      errorMessage.includes("invalid") ||
      errorMessage.includes("validation") ||
      errorMessage.includes("required field") ||
      errorMessage.includes("must be") ||
      errorMessage.includes("expected") ||
      errorMessage.includes("schema")
    ) {
      return {
        ...defaultClassification,
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.MEDIUM,
        persistence: ErrorPersistence.PERMANENT,
        retryable: false,
        message: error.message,
      };
    }

    // Server errors
    if (
      errorName === "ServerError" ||
      errorMessage.includes("server error") ||
      errorMessage.includes("internal server") ||
      errorMessage.includes("500")
    ) {
      return {
        ...defaultClassification,
        category: ErrorCategory.SERVER,
        severity: ErrorSeverity.HIGH,
        persistence: ErrorPersistence.TEMPORARY,
        retryable: true,
        message: error.message,
      };
    }

    // Integration-specific errors
    if (
      errorStack.includes("integration") ||
      errorStack.includes("connector") ||
      errorStack.includes("api") ||
      errorMessage.includes("integration") ||
      errorMessage.includes("connector") ||
      errorMessage.includes("provider")
    ) {
      return {
        ...defaultClassification,
        category: ErrorCategory.INTEGRATION,
        severity: ErrorSeverity.MEDIUM,
        persistence: ErrorPersistence.INTERMITTENT,
        retryable: true,
        message: error.message,
      };
    }
  }

  // Handle HTTP error objects
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = Number((error as any).status);

    // 4xx errors (client errors)
    if (status >= 400 && status < 500) {
      // Special case for 401/403 (auth errors)
      if (status === 401 || status === 403) {
        return {
          ...defaultClassification,
          category: ErrorCategory.AUTHORIZATION,
          severity: ErrorSeverity.HIGH,
          persistence: ErrorPersistence.PERMANENT,
          retryable: false,
          message: String(error),
          details: { status },
        };
      }

      // Special case for 429 (rate limiting)
      if (status === 429) {
        return {
          ...defaultClassification,
          category: ErrorCategory.CLIENT,
          severity: ErrorSeverity.MEDIUM,
          persistence: ErrorPersistence.TEMPORARY,
          retryable: true,
          message: String(error),
          details: { status },
        };
      }

      // Other 4xx errors
      return {
        ...defaultClassification,
        category: ErrorCategory.CLIENT,
        severity: ErrorSeverity.MEDIUM,
        persistence: ErrorPersistence.PERMANENT,
        retryable: false,
        message: String(error),
        details: { status },
      };
    }

    // 5xx errors (server errors)
    if (status >= 500 && status < 600) {
      return {
        ...defaultClassification,
        category: ErrorCategory.SERVER,
        severity: ErrorSeverity.HIGH,
        persistence: ErrorPersistence.TEMPORARY,
        retryable: true,
        message: String(error),
        details: { status },
      };
    }
  }

  // Handle custom error objects with specific fields
  if (typeof error === "object" && error !== null) {
    const errorObj = error as Record<string, any>;

    if ("category" in errorObj && typeof errorObj.category === "string") {
      // Handle pre-classified errors
      const category = errorObj.category as ErrorCategory;
      const severity =
        "severity" in errorObj && typeof errorObj.severity === "string"
          ? (errorObj.severity as ErrorSeverity)
          : defaultClassification.severity;
      const persistence =
        "persistence" in errorObj && typeof errorObj.persistence === "string"
          ? (errorObj.persistence as ErrorPersistence)
          : defaultClassification.persistence;
      const retryable =
        "retryable" in errorObj && typeof errorObj.retryable === "boolean"
          ? errorObj.retryable
          : defaultClassification.retryable;

      return {
        category,
        severity,
        persistence,
        retryable,
        message:
          "message" in errorObj ? String(errorObj.message) : String(error),
        details: errorObj,
      };
    }
  }

  // Return default classification if no specific patterns matched
  return defaultClassification;
}

/**
 * Calculate retry delay based on retry strategy and attempt number
 */
export function calculateRetryDelay(
  config: RetryConfig,
  attemptNumber: number,
): number {
  // First attempt is 0, first retry is 1
  const retryNumber = Math.max(0, attemptNumber);
  let delay: number;

  switch (config.strategy) {
    case RetryStrategy.EXPONENTIAL_BACKOFF:
      // Exponential backoff: initialDelay * (backoffFactor ^ retryNumber)
      const factor = config.backoffFactor || 2;
      delay = config.initialDelayMs * Math.pow(factor, retryNumber);
      break;

    case RetryStrategy.FIXED_INTERVAL:
      // Fixed interval: always use initialDelay
      delay = config.initialDelayMs;
      break;

    case RetryStrategy.PROGRESSIVE:
      // Progressive: initialDelay + (initialDelay * retryNumber * factor)
      const progressiveFactor = config.backoffFactor || 1;
      delay =
        config.initialDelayMs +
        config.initialDelayMs * retryNumber * progressiveFactor;
      break;

    default:
      // Default to exponential backoff
      delay = config.initialDelayMs * Math.pow(2, retryNumber);
  }

  // Apply maximum delay cap
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Determine if an error should be retried based on its classification
 */
export function shouldRetryError(
  errorClassification: ErrorClassification,
  retryConfig: RetryConfig,
  currentAttempt: number,
): boolean {
  // Don't retry if we've hit the max attempts
  if (currentAttempt >= retryConfig.maxAttempts) {
    return false;
  }

  // Don't retry if the error is marked as non-retryable
  if (!errorClassification.retryable) {
    return false;
  }

  // Check category-based exclusions
  if (
    retryConfig.nonRetryableErrors &&
    retryConfig.nonRetryableErrors.includes(errorClassification.category)
  ) {
    return false;
  }

  // Check category-based inclusions (if specified)
  if (
    retryConfig.retryableErrors &&
    retryConfig.retryableErrors.length > 0 &&
    !retryConfig.retryableErrors.includes(errorClassification.category)
  ) {
    return false;
  }

  // By default, we retry
  return true;
}

/**
 * Circuit Breaker implementation to prevent cascading failures
 */
export class CircuitBreaker {
  private state: "closed" | "open" | "half-open" = "closed";
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private failureThreshold: number = 5;
  private resetTimeout: number = 30000; // 30 seconds
  private halfOpenSuccessThreshold: number = 1;

  constructor(config?: {
    failureThreshold?: number;
    resetTimeout?: number;
    halfOpenSuccessThreshold?: number;
  }) {
    if (config) {
      this.failureThreshold = config.failureThreshold ?? this.failureThreshold;
      this.resetTimeout = config.resetTimeout ?? this.resetTimeout;
      this.halfOpenSuccessThreshold =
        config.halfOpenSuccessThreshold ?? this.halfOpenSuccessThreshold;
    }
  }

  /**
   * Record a successful operation
   */
  public recordSuccess(): void {
    if (this.state === "half-open") {
      this.successCount++;
      if (this.successCount >= this.halfOpenSuccessThreshold) {
        this.reset();
      }
    }
  }

  /**
   * Record a failed operation
   */
  public recordFailure(): void {
    this.lastFailureTime = Date.now();

    if (this.state === "closed") {
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.trip();
      }
    } else if (this.state === "half-open") {
      this.trip(); // Back to open on failure in half-open
    }
  }

  /**
   * Check if a request should be allowed through
   */
  public canRequest(): boolean {
    if (this.state === "open") {
      // Check if timeout has elapsed to transition to half-open
      const timeElapsed = Date.now() - this.lastFailureTime;
      if (timeElapsed >= this.resetTimeout) {
        this.state = "half-open";
        this.successCount = 0;
        return true;
      }
      return false;
    }

    return true; // Allow in closed or half-open state
  }

  /**
   * Trip the circuit breaker to open state
   */
  private trip(): void {
    this.state = "open";
    this.failureCount = 0;
    this.successCount = 0;
  }

  /**
   * Reset the circuit breaker to closed state
   */
  private reset(): void {
    this.state = "closed";
    this.failureCount = 0;
    this.successCount = 0;
  }

  /**
   * Get the current state of the circuit breaker
   */
  public getState(): string {
    return this.state;
  }
}
