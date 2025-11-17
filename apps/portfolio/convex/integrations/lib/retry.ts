import type { ActionContext, ActionResult } from "./registries";
import {
  ErrorCode,
  createError,
  updateErrorContext,
  wrapException,
} from "./errors";

import type { ErrorContext } from "./errors";
import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  jitterMs?: number; // Optional jitter to prevent thundering herd
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 60_000,
  backoffFactor: 2,
  jitterMs: 100,
};

/**
 * Context for tracking retry execution
 */
export interface RetryContext {
  runId: Id<"scenarioRuns">;
  scenarioId: Id<"scenarios">;
  nodeId?: Id<"nodes">;
  step: number;
  operation: string;
  correlationId: string;
}

/**
 * Executes a function with retry logic and exponential backoff
 *
 * Automatically logs each attempt and handles retryable vs fatal errors.
 * Returns the final result or a fatal error if max attempts exceeded.
 */
export async function executeWithRetry<T>(
  ctx: ActionContext,
  retryContext: RetryContext,
  fn: () => Promise<ActionResult<T>>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<ActionResult<T>> {
  let attempt = 1;
  let lastError: ActionResult<T> | null = null;
  let errorContext: ErrorContext | undefined;

  while (attempt <= config.maxAttempts) {
    const startTime = Date.now();

    try {
      const result = await fn();
      const durationMs = Date.now() - startTime;

      // Log the attempt
      await logAttempt(ctx, retryContext, {
        attempt,
        startTime,
        durationMs,
        status: result.kind,
        errorCode: "error" in result ? result.error.code : undefined,
        errorMessage: "error" in result ? result.error.message : undefined,
        data: result.kind === "success" ? result.data : undefined,
      });

      // If success or fatal error, return immediately
      if (result.kind !== "retryable_error") {
        return result;
      }

      // Store the error for potential final return
      lastError = result;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (result.error) {
        errorContext = updateErrorContext(errorContext, result.error);
      }
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const wrappedError = wrapException<T>(error);

      // Log unexpected errors as retryable by default
      await logAttempt(ctx, retryContext, {
        attempt,
        startTime,
        durationMs,
        status: wrappedError.kind,
        errorCode:
          "error" in wrappedError ? wrappedError.error.code : undefined,
        errorMessage:
          "error" in wrappedError ? wrappedError.error.message : undefined,
      });

      // If it's a fatal error, return immediately
      if (wrappedError.kind === "fatal_error") {
        return wrappedError;
      }

      lastError = wrappedError;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if ("error" in wrappedError && wrappedError.error) {
        errorContext = updateErrorContext(errorContext, wrappedError.error);
      }
    }

    // If this was the last attempt, break out of loop
    if (attempt >= config.maxAttempts) {
      break;
    }

    // Calculate backoff delay with jitter
    const baseDelay = Math.min(
      config.initialDelayMs * Math.pow(config.backoffFactor, attempt - 1),
      config.maxDelayMs,
    );

    const jitter = config.jitterMs ? Math.random() * config.jitterMs : 0;
    const delayMs = baseDelay + jitter;

    // Wait before retry
    await sleep(delayMs);

    attempt++;
  }

  // Max attempts reached - create final fatal error
  const lastErrorMessage =
    lastError && "error" in lastError
      ? lastError.error.message
      : "Unknown error";
  const finalError = createError<T>(
    ErrorCode.MAX_RETRIES_EXCEEDED,
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    `Failed after ${config.maxAttempts} attempts. Last error: ${lastErrorMessage ?? "Unknown error"}`,
  );

  // Log the final failure
  await logAttempt(ctx, retryContext, {
    attempt,
    startTime: Date.now(),
    durationMs: 0,
    status: "fatal_error",
    errorCode: "error" in finalError ? finalError.error.code : undefined,
    errorMessage: "error" in finalError ? finalError.error.message : undefined,
    errorContext,
  });

  return finalError;
}

/**
 * Logs a retry attempt to the scenario logs
 */
async function logAttempt(
  ctx: ActionContext,
  retryContext: RetryContext,
  details: {
    attempt: number;
    startTime: number;
    durationMs: number;
    status: string;
    errorCode?: string;
    errorMessage?: string;
    data?: unknown;
    errorContext?: ErrorContext;
  },
): Promise<void> {
  try {
    // Only log if we have a nodeId, since the schema requires it
    if (!retryContext.nodeId) {
      console.warn(
        "Cannot log retry attempt: nodeId is required but not provided",
      );
      return;
    }

    await ctx.runMutation(
      internal.integrations.scenarioLogs.mutations.logNodeExecution,
      {
        scenarioId: retryContext.scenarioId,
        runId: retryContext.runId,
        nodeId: retryContext.nodeId,
        action: retryContext.operation,
        status: details.status === "success" ? "success" : "error",
        startTime: details.startTime,
        endTime: details.startTime + details.durationMs,
        inputData: JSON.stringify({
          attempt: details.attempt,
          correlationId: retryContext.correlationId,
          step: retryContext.step,
        }),
        outputData: details.data ? JSON.stringify(details.data) : undefined,
        errorMessage: details.errorMessage,
      },
    );
  } catch (error) {
    // Don't fail the main operation if logging fails
    console.error("Failed to log retry attempt:", error);
  }
}

/**
 * Creates a retry configuration for different types of operations
 */
export function createRetryConfig(
  type: "fast" | "standard" | "slow" | "external",
): RetryConfig {
  switch (type) {
    case "fast":
      return {
        maxAttempts: 2,
        initialDelayMs: 100,
        maxDelayMs: 1000,
        backoffFactor: 2,
        jitterMs: 50,
      };

    case "standard":
      return DEFAULT_RETRY_CONFIG;

    case "slow":
      return {
        maxAttempts: 5,
        initialDelayMs: 2000,
        maxDelayMs: 120_000,
        backoffFactor: 2,
        jitterMs: 500,
      };

    case "external":
      return {
        maxAttempts: 4,
        initialDelayMs: 1500,
        maxDelayMs: 30_000,
        backoffFactor: 1.5,
        jitterMs: 200,
      };

    default:
      return DEFAULT_RETRY_CONFIG;
  }
}

/**
 * Utility function to sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determines if an error should be retried based on its characteristics
 */
export function shouldRetry(
  error: ActionResult<unknown>,
  attempt: number,
  maxAttempts: number,
): boolean {
  if (attempt >= maxAttempts) {
    return false;
  }

  return error.kind === "retryable_error";
}

/**
 * Creates a retry context for tracking execution
 */
export function createRetryContext(
  runId: Id<"scenarioRuns">,
  scenarioId: Id<"scenarios">,
  operation: string,
  correlationId: string,
  nodeId?: Id<"nodes">,
  step = 1,
): RetryContext {
  return {
    runId,
    scenarioId,
    nodeId,
    step,
    operation,
    correlationId,
  };
}
