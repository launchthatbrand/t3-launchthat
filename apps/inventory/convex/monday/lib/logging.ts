/**
 * Monday.com Synchronization Logging System
 *
 * This module provides comprehensive logging capabilities for the Monday.com integration,
 * including detailed sync operation tracking, error logging, and metrics collection.
 */

import { SyncLogLevel, SyncOperationType } from "./types";

import { Id } from "../../_generated/dataModel";
import { MutationCtx } from "../../_generated/server";

/**
 * Create a new sync log entry
 */
export async function createSyncLog(
  ctx: MutationCtx,
  operation: SyncOperationType,
  status: string,
  options?: {
    boardMappingId?: Id<"mondayBoardMappings">;
    mondayBoardId?: string;
    convexTable?: string;
    details?: string;
    initiatedBy?: string; // "system", "user", "schedule"
  },
): Promise<Id<"mondaySyncLogs">> {
  const now = Date.now();

  return await ctx.db.insert("mondaySyncLogs", {
    operation,
    status,
    startTimestamp: now,
    endTimestamp: now, // Will be updated when the operation completes
    boardMappingId: options?.boardMappingId,
    mondayBoardId: options?.mondayBoardId,
    convexTable: options?.convexTable,
    details: options?.details,
    initiatedBy: options?.initiatedBy || "system",
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsFailed: 0,
    messages: JSON.stringify([]),
    recordChanges: JSON.stringify([]),
    errors: JSON.stringify([]),
    performanceMetrics: JSON.stringify([]),
    phases: JSON.stringify([]),
  });
}

/**
 * Update an existing sync log entry
 */
export async function updateSyncLog(
  ctx: MutationCtx,
  logId: Id<"mondaySyncLogs">,
  status: string,
  updates?: {
    recordsProcessed?: number;
    recordsCreated?: number;
    recordsUpdated?: number;
    recordsFailed?: number;
    error?: string;
    errorDetails?: string;
    details?: string;
    timeTaken?: number;
  },
): Promise<Id<"mondaySyncLogs">> {
  const log = await ctx.db.get(logId);
  if (!log) {
    throw new Error(`Sync log ${logId} not found`);
  }

  const now = Date.now();
  const updateData: any = {
    status,
    endTimestamp: now,
  };

  // Add optional fields if provided
  if (updates) {
    if (updates.recordsProcessed !== undefined) {
      updateData.recordsProcessed = updates.recordsProcessed;
    }
    if (updates.recordsCreated !== undefined) {
      updateData.recordsCreated = updates.recordsCreated;
    }
    if (updates.recordsUpdated !== undefined) {
      updateData.recordsUpdated = updates.recordsUpdated;
    }
    if (updates.recordsFailed !== undefined) {
      updateData.recordsFailed = updates.recordsFailed;
    }
    if (updates.error !== undefined) {
      updateData.error = updates.error;
    }
    if (updates.errorDetails !== undefined) {
      updateData.errorDetails = updates.errorDetails;
    }
    if (updates.details !== undefined) {
      updateData.details = updates.details;
    }
    if (updates.timeTaken !== undefined) {
      updateData.timeTaken = updates.timeTaken;
    } else {
      // Calculate time taken if not provided
      updateData.timeTaken = now - log.startTimestamp;
    }

    // Calculate success rate if we have processed records
    if (
      (updates.recordsProcessed !== undefined || log.recordsProcessed) &&
      (updates.recordsCreated !== undefined ||
        updates.recordsUpdated !== undefined ||
        log.recordsCreated ||
        log.recordsUpdated)
    ) {
      const processed =
        updates.recordsProcessed ?? (log.recordsProcessed as number);
      const created = updates.recordsCreated ?? (log.recordsCreated as number);
      const updated = updates.recordsUpdated ?? (log.recordsUpdated as number);

      if (processed > 0) {
        updateData.successRate = ((created + updated) / processed) * 100;
      }
    }

    // Calculate throughput if we have time taken
    if (
      updateData.timeTaken &&
      (updates.recordsProcessed || log.recordsProcessed)
    ) {
      const processed =
        updates.recordsProcessed ?? (log.recordsProcessed as number);
      const timeTakenSeconds = updateData.timeTaken / 1000;
      if (timeTakenSeconds > 0) {
        updateData.throughput = processed / timeTakenSeconds;
      }
    }
  }

  await ctx.db.patch(logId, updateData);
  return logId;
}

/**
 * Log a record-level change in a sync operation
 */
export async function logRecordChange(
  ctx: MutationCtx,
  syncLogId: Id<"mondaySyncLogs">,
  change: {
    recordId: string;
    sourceId?: string;
    operation: "create" | "update" | "delete" | "error";
    table: string;
    details?: string;
    changes?: any;
    error?: string;
  },
): Promise<void> {
  const log = await ctx.db.get(syncLogId);
  if (!log) {
    throw new Error(`Sync log ${syncLogId} not found`);
  }

  // Parse existing record changes
  let recordChanges = [];
  try {
    if (log.recordChanges) {
      recordChanges = JSON.parse(log.recordChanges as string);
    }
  } catch (error) {
    console.error("Error parsing record changes:", error);
  }

  // Add new record change
  recordChanges.push({
    ...change,
    timestamp: Date.now(),
  });

  // Update the log with the new record changes
  await ctx.db.patch(syncLogId, {
    recordChanges: JSON.stringify(recordChanges),
  });
}

/**
 * Log an error with context information
 */
export async function logError(
  ctx: MutationCtx,
  syncLogId: Id<"mondaySyncLogs">,
  error: string,
  options?: {
    operation?: string;
    boardMappingId?: Id<"mondayBoardMappings">;
    recordId?: string;
    additionalDetails?: any;
  },
): Promise<void> {
  const log = await ctx.db.get(syncLogId);
  if (!log) {
    throw new Error(`Sync log ${syncLogId} not found`);
  }

  // Parse existing errors
  let errors = [];
  try {
    if (log.errors) {
      errors = JSON.parse(log.errors as string);
    }
  } catch (e) {
    console.error("Error parsing errors:", e);
  }

  // Add new error
  errors.push({
    error,
    timestamp: Date.now(),
    operation: options?.operation,
    boardMappingId: options?.boardMappingId
      ? options.boardMappingId
      : undefined,
    recordId: options?.recordId,
    additionalDetails: options?.additionalDetails,
  });

  // Update the log with the new errors
  await ctx.db.patch(syncLogId, {
    errors: JSON.stringify(errors),
  });
}

/**
 * Log a performance metric
 */
export async function logPerformanceMetric(
  ctx: MutationCtx,
  syncLogId: Id<"mondaySyncLogs">,
  metric: {
    name: string;
    value: number;
    unit?: string;
    details?: any;
  },
): Promise<void> {
  const log = await ctx.db.get(syncLogId);
  if (!log) {
    throw new Error(`Sync log ${syncLogId} not found`);
  }

  // Parse existing performance metrics
  let performanceMetrics = [];
  try {
    if (log.performanceMetrics) {
      performanceMetrics = JSON.parse(log.performanceMetrics as string);
    }
  } catch (error) {
    console.error("Error parsing performance metrics:", error);
  }

  // Add new performance metric
  performanceMetrics.push({
    ...metric,
    timestamp: Date.now(),
  });

  // Update the log with the new performance metrics
  await ctx.db.patch(syncLogId, {
    performanceMetrics: JSON.stringify(performanceMetrics),
  });
}

/**
 * Log a message
 */
export async function logMessage(
  ctx: MutationCtx,
  syncLogId: Id<"mondaySyncLogs">,
  level: SyncLogLevel,
  message: string,
  details?: any,
): Promise<void> {
  const log = await ctx.db.get(syncLogId);
  if (!log) {
    throw new Error(`Sync log ${syncLogId} not found`);
  }

  // Parse existing messages
  let messages = [];
  try {
    if (log.messages) {
      messages = JSON.parse(log.messages as string);
    }
  } catch (error) {
    console.error("Error parsing messages:", error);
  }

  // Add new message
  messages.push({
    level,
    message,
    details,
    timestamp: Date.now(),
  });

  // Update the log with the new messages
  await ctx.db.patch(syncLogId, {
    messages: JSON.stringify(messages),
  });
}

/**
 * Log the start of a sync phase
 */
export async function logSyncPhase(
  ctx: MutationCtx,
  syncLogId: Id<"mondaySyncLogs">,
  phase: string,
  details?: any,
): Promise<void> {
  const log = await ctx.db.get(syncLogId);
  if (!log) {
    throw new Error(`Sync log ${syncLogId} not found`);
  }

  // Parse existing phases
  let phases = [];
  try {
    if (log.phases) {
      phases = JSON.parse(log.phases as string);
    }
  } catch (error) {
    console.error("Error parsing phases:", error);
  }

  // Add new phase
  phases.push({
    name: phase,
    startTimestamp: Date.now(),
    details,
    inProgress: true,
  });

  // Update the log with the new phase
  await ctx.db.patch(syncLogId, {
    phases: JSON.stringify(phases),
    currentPhase: phase,
  });
}

/**
 * End a sync phase
 */
export async function endSyncPhase(
  ctx: MutationCtx,
  syncLogId: Id<"mondaySyncLogs">,
  options?: {
    success?: boolean;
    details?: any;
  },
): Promise<void> {
  const log = await ctx.db.get(syncLogId);
  if (!log) {
    throw new Error(`Sync log ${syncLogId} not found`);
  }

  // Parse existing phases
  let phases = [];
  try {
    if (log.phases) {
      phases = JSON.parse(log.phases as string);
    }
  } catch (error) {
    console.error("Error parsing phases:", error);
  }

  // Find the last phase that is in progress
  let lastPhaseIndex = -1;
  for (let i = phases.length - 1; i >= 0; i--) {
    if (phases[i].inProgress) {
      lastPhaseIndex = i;
      break;
    }
  }

  if (lastPhaseIndex >= 0) {
    const now = Date.now();
    phases[lastPhaseIndex].endTimestamp = now;
    phases[lastPhaseIndex].timeTaken =
      now - phases[lastPhaseIndex].startTimestamp;
    phases[lastPhaseIndex].inProgress = false;
    phases[lastPhaseIndex].success = options?.success ?? true;
    if (options?.details) {
      phases[lastPhaseIndex].details = {
        ...phases[lastPhaseIndex].details,
        ...options.details,
      };
    }
  }

  // Update the log with the updated phases
  await ctx.db.patch(syncLogId, {
    phases: JSON.stringify(phases),
    currentPhase: null,
  });
}

/**
 * Calculate and update sync metrics
 */
export async function calculateSyncMetrics(
  ctx: MutationCtx,
  syncLogId: Id<"mondaySyncLogs">,
): Promise<void> {
  const log = await ctx.db.get(syncLogId);
  if (!log) {
    throw new Error(`Sync log ${syncLogId} not found`);
  }

  // Calculate success rate
  const recordsProcessed = (log.recordsProcessed as number) || 0;
  const recordsCreated = (log.recordsCreated as number) || 0;
  const recordsUpdated = (log.recordsUpdated as number) || 0;
  const recordsFailed = (log.recordsFailed as number) || 0;

  let successRate = 0;
  if (recordsProcessed > 0) {
    successRate = ((recordsCreated + recordsUpdated) / recordsProcessed) * 100;
  }

  // Calculate throughput
  let throughput = 0;
  const timeTaken = (log.timeTaken as number) || 0;
  if (timeTaken > 0) {
    const timeTakenSeconds = timeTaken / 1000;
    throughput = recordsProcessed / timeTakenSeconds;
  }

  // Calculate phase metrics
  let phaseMetrics: any = {};
  try {
    if (log.phases) {
      const phases = JSON.parse(log.phases as string);
      phaseMetrics = phases.reduce((acc: any, phase: any) => {
        if (phase.name && phase.timeTaken) {
          acc[phase.name] = {
            time: phase.timeTaken,
            success: phase.success ?? true,
          };
        }
        return acc;
      }, {});
    }
  } catch (error) {
    console.error("Error parsing phases for metrics:", error);
  }

  // Prepare metrics object
  const metrics = {
    successRate,
    throughput,
    recordsProcessed,
    recordsCreated,
    recordsUpdated,
    recordsFailed,
    errorRate:
      recordsProcessed > 0 ? (recordsFailed / recordsProcessed) * 100 : 0,
    phaseBreakdown: phaseMetrics,
    timestamp: Date.now(),
  };

  // Update the log with metrics
  await ctx.db.patch(syncLogId, {
    metrics: JSON.stringify(metrics),
    successRate,
    throughput,
  });
}
