import { ErrorCode, createError } from "./errors";

import type { ActionContext } from "./registries";
import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";

/**
 * Result of idempotency check
 */
export interface IdempotencyResult {
  isNew: boolean;
  runId: Id<"scenarioRuns">;
  existingStatus?: "pending" | "running" | "succeeded" | "failed" | "cancelled";
}

/**
 * Options for creating a new scenario run
 */
export interface CreateRunOptions {
  scenarioId: Id<"scenarios">;
  triggerKey: string;
  correlationId: string;
  connectionId?: Id<"connections">;
  idempotencyKey?: string;
}

/**
 * Ensures idempotent execution of scenario runs
 *
 * Uses the atomic ensureIdempotentRun mutation to prevent race conditions
 * that could occur with separate query + mutation calls.
 */
export async function ensureIdempotent(
  ctx: ActionContext,
  options: CreateRunOptions,
): Promise<IdempotencyResult> {
  try {
    // Use the atomic internal mutation that combines check + insert
    const result = (await ctx.runMutation(
      internal.integrations.scenarioRuns.mutations.ensureIdempotentRun,
      {
        scenarioId: options.scenarioId,
        triggerKey: options.triggerKey,
        correlationId: options.correlationId,
        connectionId: options.connectionId,
      },
    )) as IdempotencyResult;

    return result;
  } catch (error) {
    const errorObj = createError(
      ErrorCode.IDEMPOTENCY_CONFLICT,
      `Failed to ensure idempotent execution: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw errorObj;
  }
}

/**
 * Creates a correlation ID for a scenario run
 * Format: {triggerKey}:{scenarioId}:{timestamp}:{random}
 */
export function createCorrelationId(
  triggerKey: string,
  scenarioId: Id<"scenarios">,
  additionalContext?: string,
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const context = additionalContext ? `:${additionalContext}` : "";

  return `${triggerKey}:${scenarioId}:${timestamp}:${random}${context}`;
}

/**
 * Creates an idempotency key for external API calls
 * Format: {prefix}:{correlationId}:{operation}
 */
export function createIdempotencyKey(
  correlationId: string,
  operation: string,
  prefix = "integrations",
): string {
  return `${prefix}:${correlationId}:${operation}`;
}

/**
 * Validates that a correlation ID follows the expected format
 */
export function validateCorrelationId(correlationId: string): boolean {
  // Should be at least triggerKey:scenarioId:timestamp:random
  const parts = correlationId.split(":");
  return parts.length >= 4 && parts.every((part) => part.length > 0);
}

/**
 * Extracts components from a correlation ID
 */
export function parseCorrelationId(correlationId: string): {
  triggerKey: string;
  scenarioId: string;
  timestamp: string;
  random: string;
  additionalContext?: string;
} | null {
  const parts = correlationId.split(":");

  if (parts.length < 4) {
    return null;
  }

  return {
    triggerKey: parts[0] ?? "",
    scenarioId: parts[1] ?? "",
    timestamp: parts[2] ?? "",
    random: parts[3] ?? "",
    additionalContext: parts.slice(4).join(":"),
  };
}
