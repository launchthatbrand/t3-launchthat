import type { ActionContext, ActionResult } from "./registries";
import { ErrorCode, createError, createSuccess, wrapException } from "./errors";
import { createCorrelationId, ensureIdempotent } from "./idempotency";
import {
  createRetryConfig,
  createRetryContext,
  executeWithRetry,
} from "./retry";
import {
  isRunCompleted,
  markRunAsCancelled,
  markRunAsFailed,
  markRunAsSucceeded,
} from "./runManagement";

import type { Id } from "../../_generated/dataModel";
import type { RetryConfig } from "./retry";
import type { RunStatus } from "./runManagement";
import { actionRegistry } from "./registries";

/**
 * Options for executing an action within a scenario
 */
export interface ExecuteActionOptions {
  scenarioId: Id<"scenarios">;
  nodeId?: Id<"nodes">;
  actionType: string;
  config: unknown;
  input: unknown;
  triggerKey: string;
  connectionId?: Id<"connections">;
  correlationId?: string;
  retryConfig?: RetryConfig;
  step?: number;
}

/**
 * Result of action execution including run tracking
 */
export interface ActionExecutionResult<T = unknown> {
  result: ActionResult<T>;
  runId: Id<"scenarioRuns">;
  isNewRun: boolean;
  duration: number;
  attempts: number;
}

/**
 * Executes an action with full reliability features:
 * - Idempotency checking
 * - Retry logic with exponential backoff
 * - Comprehensive error handling and logging
 * - Run lifecycle management
 */
export async function executeAction<T = unknown>(
  ctx: ActionContext,
  options: ExecuteActionOptions,
): Promise<ActionExecutionResult<T>> {
  const startTime = Date.now();
  let runId: Id<"scenarioRuns"> | undefined;
  let isNewRun = false;
  let attempts = 0;

  try {
    // Ensure idempotent execution
    const correlationId =
      options.correlationId ??
      createCorrelationId(
        options.triggerKey,
        options.scenarioId,
        options.nodeId,
      );

    const idempotencyResult = await ensureIdempotent(ctx, {
      scenarioId: options.scenarioId,
      triggerKey: options.triggerKey,
      correlationId,
      connectionId: options.connectionId,
    });

    runId = idempotencyResult.runId;
    isNewRun = idempotencyResult.isNew;

    // If run already exists and is completed, return the cached result
    if (!isNewRun && idempotencyResult.existingStatus) {
      if (isRunCompleted(idempotencyResult.existingStatus)) {
        return {
          result: await getCachedResult<T>(
            ctx,
            runId,
            idempotencyResult.existingStatus,
          ),
          runId,
          isNewRun: false,
          duration: Date.now() - startTime,
          attempts: 0,
        };
      }
    }

    // Get the action definition from registry
    const actionDef = actionRegistry.get(options.actionType);

    // Validate config and input
    const validatedConfig = actionDef.configSchema.parse(options.config);
    const validatedInput = actionDef.inputSchema.parse(options.input);

    // Create retry context
    const retryContext = createRetryContext(
      runId,
      options.scenarioId,
      `execute_action:${options.actionType}`,
      correlationId,
      options.nodeId,
      options.step ?? 1,
    );

    // Execute with retry logic
    const retryConfig = options.retryConfig ?? createRetryConfig("standard");

    const result = await executeWithRetry<T>(
      ctx,
      retryContext,
      async () => {
        attempts++;

        // Execute the actual action
        const actionResult = await actionDef.execute(
          ctx,
          validatedInput,
          validatedConfig,
        );

        // Validate output schema
        if (actionResult.kind === "success") {
          const validatedOutput = actionDef.outputSchema.parse(
            actionResult.data,
          );
          return createSuccess<T>(validatedOutput as T);
        }

        return actionResult as ActionResult<T>;
      },
      retryConfig,
    );

    // Update run status based on result
    if (result.kind === "success") {
      await markRunAsSucceeded(ctx, runId, options.scenarioId, {
        actionType: options.actionType,
        nodeId: options.nodeId,
        attempts,
        duration: Date.now() - startTime,
      });
    } else if ("error" in result && result.error) {
      await markRunAsFailed(ctx, runId, options.scenarioId, result.error, {
        isFatal: result.kind === "fatal_error",
        retryCount: attempts - 1,
        triggerAlert: result.kind === "fatal_error",
      });
    }

    return {
      result,
      runId,
      isNewRun,
      duration: Date.now() - startTime,
      attempts,
    };
  } catch (error) {
    // Handle unexpected errors
    const wrappedError = wrapException<T>(error);

    // If we have a runId, mark it as failed
    if (runId && "error" in wrappedError && wrappedError.error) {
      await markRunAsFailed(
        ctx,
        runId,
        options.scenarioId,
        wrappedError.error,
        {
          isFatal: true,
          retryCount: attempts,
          triggerAlert: true,
        },
      );
    }

    return {
      result: wrappedError,
      runId: runId ?? ("" as Id<"scenarioRuns">),
      isNewRun,
      duration: Date.now() - startTime,
      attempts,
    };
  }
}

/**
 * Executes multiple actions in sequence with shared run context
 */
export async function executeActionSequence<T = unknown>(
  ctx: ActionContext,
  actions: ExecuteActionOptions[],
  options: {
    stopOnError?: boolean;
    sharedCorrelationId?: string;
    retryConfig?: RetryConfig;
  } = {},
): Promise<ActionExecutionResult<T>[]> {
  const results: ActionExecutionResult<T>[] = [];
  const sharedCorrelationId =
    options.sharedCorrelationId ??
    createCorrelationId(
      "sequence",
      actions[0]?.scenarioId ?? ("" as Id<"scenarios">),
    );

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i]!;

    try {
      const result = await executeAction<T>(ctx, {
        ...action,
        correlationId: `${sharedCorrelationId}:step_${i + 1}`,
        step: i + 1,
        retryConfig: options.retryConfig ?? action.retryConfig,
      });

      results.push(result);

      // Stop on error if configured to do so
      if (options.stopOnError && result.result.kind !== "success") {
        break;
      }
    } catch (error) {
      const wrappedError = wrapException<T>(error);

      results.push({
        result: wrappedError,
        runId: "" as Id<"scenarioRuns">, // Will be filled by executeAction
        isNewRun: false,
        duration: 0,
        attempts: 0,
      });

      if (options.stopOnError) {
        break;
      }
    }
  }

  return results;
}

/**
 * Cancels a running scenario and marks it as cancelled
 */
export async function cancelExecution(
  ctx: ActionContext,
  runId: Id<"scenarioRuns">,
  reason?: string,
): Promise<void> {
  await markRunAsCancelled(ctx, runId, reason);
}

/**
 * Gets cached result for completed runs
 */
async function getCachedResult<T>(
  ctx: ActionContext,
  runId: Id<"scenarioRuns">,
  status: RunStatus,
): Promise<ActionResult<T>> {
  // In a real implementation, we'd fetch the actual result from logs
  // For now, we'll return a simple status-based result

  switch (status) {
    case "succeeded":
      return createSuccess({} as T); // Should be actual cached result
    case "failed":
      return createError(ErrorCode.EXECUTION_FAILED, "Run previously failed");
    case "cancelled":
      return createError(ErrorCode.EXECUTION_FAILED, "Run was cancelled");
    default:
      return createError(ErrorCode.UNKNOWN_ERROR, "Unknown run status");
  }
}

/**
 * Creates execution options for common action types
 */
export function createExecutionOptions(
  scenarioId: Id<"scenarios">,
  actionType: string,
  overrides: Partial<ExecuteActionOptions> = {},
): ExecuteActionOptions {
  return {
    scenarioId,
    actionType,
    config: {},
    input: {},
    triggerKey: "manual",
    ...overrides,
  };
}

/**
 * Utility function to create a reliable webhook execution
 */
export async function executeWebhookAction(
  ctx: ActionContext,
  scenarioId: Id<"scenarios">,
  webhookConfig: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    payload: unknown;
    connectionId?: Id<"connections">;
  },
  options: {
    triggerKey?: string;
    retryConfig?: RetryConfig;
    correlationId?: string;
  } = {},
): Promise<ActionExecutionResult> {
  return executeAction(ctx, {
    scenarioId,
    actionType: "webhook",
    config: {
      url: webhookConfig.url,
      method: webhookConfig.method ?? "POST",
      headers: webhookConfig.headers ?? {},
      connectionId: webhookConfig.connectionId,
    },
    input: webhookConfig.payload,
    triggerKey: options.triggerKey ?? "webhook",
    connectionId: webhookConfig.connectionId,
    correlationId: options.correlationId,
    retryConfig: options.retryConfig ?? createRetryConfig("external"),
  });
}
