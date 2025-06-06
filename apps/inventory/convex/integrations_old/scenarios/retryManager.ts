/**
 * Retry Manager for Scenario Executions
 *
 * This file provides functionality for managing retries of failed nodes in scenario executions,
 * including scheduling retries with appropriate delays based on retry strategy.
 */

import { Infer, v } from "convex/values";

import { internal } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";
import {
  calculateRetryDelay,
  CircuitBreaker,
  classifyError,
  DEFAULT_RETRY_CONFIGS,
  ErrorCategory,
  RetryConfig,
  RetryStrategy,
  shouldRetryError,
} from "../lib/errorHandling";

// Retry attempt tracking by node/execution
interface RetryState {
  nodeId: string;
  executionId: string;
  attempts: number;
  lastError: unknown;
  nextRetryTime: number | null;
  circuitBreaker: CircuitBreaker;
}

// In-memory store of retry states
// In a production system, this would be persisted in the database
const retryStates: Map<string, RetryState> = new Map();

/**
 * Get a unique key for a node retry state
 */
function getRetryStateKey(nodeId: string, executionId: string): string {
  return `${executionId}:${nodeId}`;
}

/**
 * Get or create a retry state for a node execution
 */
export function getRetryState(nodeId: string, executionId: string): RetryState {
  const key = getRetryStateKey(nodeId, executionId);

  if (!retryStates.has(key)) {
    retryStates.set(key, {
      nodeId,
      executionId,
      attempts: 0,
      lastError: null,
      nextRetryTime: null,
      circuitBreaker: new CircuitBreaker(),
    });
  }

  return retryStates.get(key)!;
}

/**
 * Reset a retry state
 */
export function resetRetryState(nodeId: string, executionId: string): void {
  const key = getRetryStateKey(nodeId, executionId);
  retryStates.delete(key);
}

/**
 * Clean up retry states for an execution
 */
export function cleanupExecutionRetryStates(executionId: string): void {
  for (const [key, state] of retryStates.entries()) {
    if (state.executionId === executionId) {
      retryStates.delete(key);
    }
  }
}

/**
 * Record a failed attempt and calculate next retry
 */
export function recordFailedAttempt(
  ctx: any,
  nodeId: string,
  executionId: string,
  error: unknown,
  retryConfig?: RetryConfig,
): {
  shouldRetry: boolean;
  retryDelay: number;
  attemptsRemaining: number;
} {
  // Get the retry state
  const state = getRetryState(nodeId, executionId);

  // Update the state
  state.attempts += 1;
  state.lastError = error;

  // Record failure in circuit breaker
  state.circuitBreaker.recordFailure();

  // Check if circuit breaker allows retries
  if (!state.circuitBreaker.canRequest()) {
    return {
      shouldRetry: false,
      retryDelay: -1,
      attemptsRemaining: 0,
    };
  }

  // Classify the error
  const errorClassification = classifyError(error);

  // Get retry configuration (use default if not provided)
  const config =
    retryConfig || DEFAULT_RETRY_CONFIGS[RetryStrategy.EXPONENTIAL_BACKOFF];

  // Determine if this error should be retried
  const shouldRetry = shouldRetryError(
    errorClassification,
    config,
    state.attempts,
  );

  // Calculate retry delay
  const retryDelay = shouldRetry
    ? calculateRetryDelay(config, state.attempts)
    : -1;

  // Calculate next retry time
  state.nextRetryTime = retryDelay > 0 ? Date.now() + retryDelay : null;

  // Calculate attempts remaining
  const attemptsRemaining = Math.max(0, config.maxAttempts - state.attempts);

  // Return retry information
  return {
    shouldRetry,
    retryDelay,
    attemptsRemaining,
  };
}

/**
 * Record a successful attempt
 */
export function recordSuccessfulAttempt(
  nodeId: string,
  executionId: string,
): void {
  const state = getRetryState(nodeId, executionId);

  // Record success in circuit breaker
  state.circuitBreaker.recordSuccess();

  // Reset retry state
  resetRetryState(nodeId, executionId);
}

/**
 * Schedule a retry for a failed node
 */
export async function scheduleRetry(
  ctx: any,
  nodeId: Id<"nodes">,
  executionId: Id<"scenario_executions">,
  scenarioId: Id<"scenarios">,
  error: unknown,
  retryConfig?: RetryConfig,
): Promise<{ scheduled: boolean; nextRetryTime: number | null }> {
  // Record failure and get retry information
  const { shouldRetry, retryDelay, attemptsRemaining } = recordFailedAttempt(
    ctx,
    nodeId.toString(),
    executionId.toString(),
    error,
    retryConfig,
  );

  // If retry is not allowed, return early
  if (!shouldRetry || retryDelay < 0) {
    return { scheduled: false, nextRetryTime: null };
  }

  // Log retry attempt
  console.log(
    `Scheduling retry for node ${nodeId} in execution ${executionId} in ${retryDelay}ms (${attemptsRemaining} attempts remaining)`,
  );

  // Record retry in execution log
  await ctx.runMutation(
    internal.integrations.scenarios.monitoring.logExecutionEvent,
    {
      executionId,
      eventType: "node_retry_scheduled",
      nodeId,
      details: {
        error: error instanceof Error ? error.message : String(error),
        retryDelay,
        attemptsRemaining,
        nextRetryTime: Date.now() + retryDelay,
      },
    },
  );

  // Schedule the retry
  await ctx.scheduler.runAfter(
    retryDelay,
    internal.integrations.scenarios.execution.retryNodeExecution,
    {
      nodeId,
      executionId,
      scenarioId,
      retryCount: attemptsRemaining,
    },
  );

  return { scheduled: true, nextRetryTime: Date.now() + retryDelay };
}

/**
 * Check if a node execution is eligible for retry
 */
export function isRetryEligible(
  nodeId: string,
  executionId: string,
  error: unknown,
  retryConfig?: RetryConfig,
): boolean {
  // Get retry state
  const state = getRetryState(nodeId, executionId);

  // Check if circuit breaker allows retries
  if (!state.circuitBreaker.canRequest()) {
    return false;
  }

  // Classify the error
  const errorClassification = classifyError(error);

  // Get retry configuration
  const config =
    retryConfig || DEFAULT_RETRY_CONFIGS[RetryStrategy.EXPONENTIAL_BACKOFF];

  // Determine if this error should be retried
  return shouldRetryError(errorClassification, config, state.attempts);
}

/**
 * Get retry status for a node execution
 */
export function getRetryStatus(
  nodeId: string,
  executionId: string,
): {
  attempts: number;
  circuitBreakerState: string;
  nextRetryTime: number | null;
} {
  // Get retry state (or create a new one with 0 attempts)
  const state = getRetryState(nodeId, executionId);

  return {
    attempts: state.attempts,
    circuitBreakerState: state.circuitBreaker.getState(),
    nextRetryTime: state.nextRetryTime,
  };
}

/**
 * Retry validator for node execution
 */
export const retryNodeExecutionValidator = v.object({
  nodeId: v.id("nodes"),
  executionId: v.id("scenario_executions"),
  scenarioId: v.id("scenarios"),
  retryCount: v.number(),
  previousAttempts: v.optional(
    v.array(
      v.object({
        timestamp: v.number(),
        error: v.string(),
      }),
    ),
  ),
});

export type RetryNodeExecution = Infer<typeof retryNodeExecutionValidator>;
