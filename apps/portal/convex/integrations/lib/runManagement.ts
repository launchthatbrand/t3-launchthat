import { ErrorCode, createError } from "./errors";

import type { ActionContext } from "./registries";
import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";

/**
 * Status values for scenario runs
 */
export type RunStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

/**
 * Error details for failed runs
 */
export interface RunError {
  code: string;
  message: string;
  timestamp: number;
  retryCount?: number;
  isFatal?: boolean;
}

/**
 * Options for updating run status
 */
export interface UpdateRunStatusOptions {
  runId: Id<"scenarioRuns">;
  status: RunStatus;
  error?: RunError;
  metadata?: Record<string, unknown>;
}

/**
 * Marks a scenario run as failed and handles dead-letter processing
 *
 * This function updates the run status to 'failed' and optionally
 * triggers notifications or alerts for permanently failed runs.
 */
export async function markRunAsFailed(
  ctx: ActionContext,
  runId: Id<"scenarioRuns">,
  scenarioId: Id<"scenarios">,
  error: { code: string; message: string },
  options: {
    isFatal?: boolean;
    retryCount?: number;
    triggerAlert?: boolean;
  } = {},
): Promise<void> {
  try {
    // Update the run status to failed
    await ctx.runMutation(
      internal.integrations.scenarioRuns.mutations.completeScenarioRun,
      {
        runId,
        status: "failed",
      },
    );

    // Log the failure details
    await ctx.runMutation(
      internal.integrations.scenarioLogs.mutations.logScenarioComplete,
      {
        scenarioId,
        runId,
        status: "error",
        startTime: Date.now(),
        errorMessage: `Run failed: ${error.code} - ${error.message}${options.retryCount ? ` (after ${options.retryCount} retries)` : ""}`,
      },
    );

    // If this is a fatal error or we want to trigger alerts, handle dead-letter processing
    if (options.isFatal || options.triggerAlert) {
      await handleDeadLetter(ctx, runId, scenarioId, error, options);
    }
  } catch (err) {
    // Don't fail the main operation if status update fails
    console.error("Failed to mark run as failed:", err);
    const errorResult = createError(
      ErrorCode.EXECUTION_FAILED,
      `Failed to update run status: ${err instanceof Error ? err.message : String(err)}`,
    );
    throw new Error(
      "error" in errorResult ? errorResult.error.message : "Unknown error",
    );
  }
}

/**
 * Marks a scenario run as succeeded
 */
export async function markRunAsSucceeded(
  ctx: ActionContext,
  runId: Id<"scenarioRuns">,
  scenarioId: Id<"scenarios">,
  _metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await ctx.runMutation(
      internal.integrations.scenarioRuns.mutations.completeScenarioRun,
      {
        runId,
        status: "succeeded",
      },
    );

    // Log the success
    await ctx.runMutation(
      internal.integrations.scenarioLogs.mutations.logScenarioComplete,
      {
        scenarioId,
        runId,
        status: "success",
        startTime: Date.now(),
        errorMessage: undefined,
      },
    );
  } catch (error) {
    console.error("Failed to mark run as succeeded:", error);
  }
}

/**
 * Marks a scenario run as cancelled
 */
export async function markRunAsCancelled(
  ctx: ActionContext,
  runId: Id<"scenarioRuns">,
  scenarioId: Id<"scenarios">,
  reason?: string,
): Promise<void> {
  try {
    await ctx.runMutation(
      internal.integrations.scenarioRuns.mutations.completeScenarioRun,
      {
        runId,
        status: "cancelled",
      },
    );

    // Log the cancellation
    await ctx.runMutation(
      internal.integrations.scenarioLogs.mutations.logScenarioComplete,
      {
        scenarioId,
        runId,
        status: "error",
        startTime: Date.now(),
        errorMessage: reason ? `Run cancelled: ${reason}` : "Run cancelled",
      },
    );
  } catch (error) {
    console.error("Failed to mark run as cancelled:", error);
  }
}

/**
 * Gets the current status of a scenario run
 */
export function getRunStatus(
  _ctx: ActionContext,
  _runId: Id<"scenarioRuns">,
): RunStatus | null {
  try {
    // Note: This would need a query to get run by ID, which might not exist yet
    // For now, we'll assume the caller has the run status available
    // In a real implementation, we'd add a query like:
    // const run = await ctx.runQuery(internal.integrations.scenarioRuns.queries.getById, { runId });
    // return run?.status ?? null;

    console.warn("getRunStatus not fully implemented - requires getById query");
    return null;
  } catch (error) {
    console.error("Failed to get run status:", error);
    return null;
  }
}

/**
 * Handles dead-letter processing for permanently failed runs
 *
 * This could include:
 * - Sending notifications to administrators
 * - Triggering alerts in monitoring systems
 * - Recording in a dead-letter queue for manual review
 * - Automatically creating support tickets
 */
async function handleDeadLetter(
  ctx: ActionContext,
  runId: Id<"scenarioRuns">,
  scenarioId: Id<"scenarios">,
  error: { code: string; message: string },
  options: {
    retryCount?: number;
    triggerAlert?: boolean;
  },
): Promise<void> {
  try {
    // Log dead-letter event - but skip it since logNodeExecution requires nodeId
    // await ctx.runMutation(
    //   internal.integrations.scenarioLogs.mutations.logNodeExecution,
    //   {
    //     scenarioId,
    //     runId,
    //     nodeId: undefined, // This would fail validation since nodeId is required
    //     action: "dead_letter_processing",
    //     status: "error",
    //     startTime: Date.now(),
    //     endTime: Date.now(),
    //     inputData: JSON.stringify({
    //       errorCode: error.code,
    //       retryCount: options.retryCount,
    //     }),
    //     errorMessage: `Dead letter: ${error.message}`,
    //   },
    // );

    // Use logScenarioComplete instead for dead letter logging
    await ctx.runMutation(
      internal.integrations.scenarioLogs.mutations.logScenarioComplete,
      {
        scenarioId,
        runId,
        status: "error",
        startTime: Date.now(),
        errorMessage: `Dead letter processing: ${error.code} - ${error.message}${options.retryCount ? ` (after ${options.retryCount} retries)` : ""}`,
      },
    );

    // TODO: Add integrations for:
    // 1. Email notifications to administrators
    // 2. Slack/Discord webhook notifications
    // 3. PagerDuty/OpsGenie alerts for critical failures
    // 4. Database logging for analytics and monitoring

    console.warn(
      "Dead letter processing logged - external notifications not implemented",
    );
  } catch (err) {
    console.error("Failed to handle dead letter:", err);
  }
}

/**
 * Checks if a run has been completed (succeeded, failed, or cancelled)
 */
export function isRunCompleted(status: RunStatus): boolean {
  return ["succeeded", "failed", "cancelled"].includes(status);
}

/**
 * Checks if a run is currently active (pending or running)
 */
export function isRunActive(status: RunStatus): boolean {
  return ["pending", "running"].includes(status);
}

/**
 * Creates a run error object with standardized format
 */
export function createRunError(
  code: string,
  message: string,
  options: {
    retryCount?: number;
    isFatal?: boolean;
  } = {},
): RunError {
  return {
    code,
    message,
    timestamp: Date.now(),
    retryCount: options.retryCount,
    isFatal: options.isFatal,
  };
}

/**
 * Estimates the total runtime of a scenario run
 */
export function calculateRunDuration(
  startedAt: number,
  finishedAt?: number,
): number {
  const endTime = finishedAt ?? Date.now();
  return Math.max(0, endTime - startedAt);
}

/**
 * Formats run duration for human-readable display
 */
export function formatRunDuration(durationMs: number): string {
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  const seconds = Math.floor(durationMs / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
}
