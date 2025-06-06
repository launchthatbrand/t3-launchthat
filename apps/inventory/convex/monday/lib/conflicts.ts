/**
 * Monday.com Conflict Detection and Resolution
 *
 * This module contains utilities for detecting and resolving conflicts during
 * bidirectional synchronization between Convex and Monday.com.
 */

import type {
  MondayBoardMapping,
  MondayColumnMapping,
  MondayIntegration,
  MondayItemMapping,
  TriggerEvent,
} from "./types";
import { logError, logMessage, logRecordChange } from "./logging";

import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";

/**
 * Conflict resolution strategies
 */
export const CONFLICT_RESOLUTION_STRATEGIES = [
  "latest_wins",
  "monday_wins",
  "convex_wins",
  "manual",
] as const;

export type ConflictResolutionStrategy =
  (typeof CONFLICT_RESOLUTION_STRATEGIES)[number];

/**
 * Conflict status types
 */
export type ConflictStatus =
  | "detected"
  | "resolved_auto"
  | "resolved_manual"
  | "unresolved";

/**
 * Conflict record structure
 */
export interface ConflictRecord {
  _id?: Id<"mondaySyncConflicts">;
  _creationTime?: number;
  boardMappingId: Id<"mondayBoardMappings">;
  itemMappingId: Id<"mondayItemMappings">;
  mondayItemId: string;
  convexId: string;
  convexTable: string;
  detectedAt: number;
  resolvedAt?: number;
  status: ConflictStatus;
  resolutionStrategy?: ConflictResolutionStrategy;
  resolvedBy?: string; // "system" or user ID
  conflictingFields: string[]; // List of field names in conflict
  mondayValues: string; // JSON string with Monday.com values
  convexValues: string; // JSON string with Convex values
  resolvedValues?: string; // JSON string with resolved values
  lastMondayUpdate?: number; // Timestamp of last Monday.com update
  lastConvexUpdate?: number; // Timestamp of last Convex update
  syncLogId?: Id<"mondaySyncLogs">; // Reference to the sync log
  notes?: string; // Additional notes or context
}

/**
 * Field-level conflict details
 */
export interface FieldConflict {
  field: string;
  mondayValue: unknown;
  convexValue: unknown;
  resolvedValue?: unknown;
  isResolved: boolean;
}

/**
 * Detect conflicts between Monday.com and Convex data
 */
export function detectConflicts(
  mondayData: Record<string, unknown>,
  convexData: Record<string, unknown>,
  lastSyncTimestamp: number,
  lastMondayUpdate?: number,
  lastConvexUpdate?: number,
): {
  hasConflicts: boolean;
  conflictingFields: string[];
  fieldConflicts: FieldConflict[];
} {
  // Initialize result
  const result = {
    hasConflicts: false,
    conflictingFields: [] as string[],
    fieldConflicts: [] as FieldConflict[],
  };

  // No conflicts if either data source is missing
  if (!mondayData || !convexData) {
    return result;
  }

  // Check if both sides have been updated since last sync
  const bothUpdated =
    lastMondayUpdate !== undefined &&
    lastMondayUpdate > lastSyncTimestamp &&
    lastConvexUpdate !== undefined &&
    lastConvexUpdate > lastSyncTimestamp;

  // Skip conflict detection if both sides haven't been updated
  if (!bothUpdated) {
    return result;
  }

  // Compare each field in the Monday.com data with the Convex data
  for (const [field, mondayValue] of Object.entries(mondayData)) {
    // Skip internal fields that start with underscore except _mondayItemId
    if (field.startsWith("_") && field !== "_mondayItemId") {
      continue;
    }

    const convexValue = convexData[field];

    // Skip if values are identical
    if (JSON.stringify(mondayValue) === JSON.stringify(convexValue)) {
      continue;
    }

    // We have a conflict
    result.hasConflicts = true;
    result.conflictingFields.push(field);
    result.fieldConflicts.push({
      field,
      mondayValue,
      convexValue,
      isResolved: false,
    });
  }

  return result;
}

/**
 * Create a conflict record in the database
 */
export async function createConflictRecord(
  ctx: MutationCtx,
  boardMapping: MondayBoardMapping,
  itemMapping: MondayItemMapping,
  conflictingFields: string[],
  mondayValues: Record<string, unknown>,
  convexValues: Record<string, unknown>,
  options?: {
    syncLogId?: Id<"mondaySyncLogs">;
    lastMondayUpdate?: number;
    lastConvexUpdate?: number;
  },
): Promise<Id<"mondaySyncConflicts">> {
  const now = Date.now();

  // Create conflict record
  const conflictId = await ctx.db.insert("mondaySyncConflicts", {
    boardMappingId: boardMapping._id,
    itemMappingId: itemMapping._id,
    mondayItemId: itemMapping.mondayItemId,
    convexId: itemMapping.convexId,
    convexTable: itemMapping.convexTable,
    detectedAt: now,
    status: "detected" as const,
    conflictingFields,
    mondayValues: JSON.stringify(mondayValues),
    convexValues: JSON.stringify(convexValues),
    lastMondayUpdate: options?.lastMondayUpdate,
    lastConvexUpdate: options?.lastConvexUpdate,
    syncLogId: options?.syncLogId,
  });

  // Log the conflict detection
  if (options?.syncLogId) {
    await logMessage(
      ctx,
      options.syncLogId,
      "warning",
      `Conflict detected for ${itemMapping.convexTable}:${itemMapping.convexId} / Monday item ${itemMapping.mondayItemId}`,
      {
        conflictId,
        conflictingFields,
      },
    );
  }

  return conflictId;
}

/**
 * Resolve a conflict using the specified strategy
 */
export async function resolveConflict(
  ctx: MutationCtx,
  conflictId: Id<"mondaySyncConflicts">,
  strategy: ConflictResolutionStrategy,
  options?: {
    manualResolution?: Record<string, unknown>;
    resolvedBy?: string;
    syncLogId?: Id<"mondaySyncLogs">;
    applyChanges?: boolean;
  },
): Promise<{
  success: boolean;
  resolvedValues: Record<string, unknown>;
  error?: string;
}> {
  // Get the conflict record
  const conflict = await ctx.db.get(conflictId);
  if (!conflict) {
    return {
      success: false,
      resolvedValues: {},
      error: `Conflict record ${conflictId} not found`,
    };
  }

  // Skip if already resolved
  if (
    conflict.status === "resolved_auto" ||
    conflict.status === "resolved_manual"
  ) {
    return {
      success: true,
      resolvedValues: conflict.resolvedValues
        ? JSON.parse(conflict.resolvedValues)
        : {},
    };
  }

  // Parse stored values
  const mondayValues = JSON.parse(conflict.mondayValues) as Record<
    string,
    unknown
  >;
  const convexValues = JSON.parse(conflict.convexValues) as Record<
    string,
    unknown
  >;

  // Apply resolution strategy
  let resolvedValues: Record<string, unknown> = {};
  let resolutionStatus: ConflictStatus = "resolved_auto";

  switch (strategy) {
    case "latest_wins":
      // Use the most recently updated values
      if (
        conflict.lastMondayUpdate !== undefined &&
        conflict.lastConvexUpdate !== undefined &&
        conflict.lastMondayUpdate > conflict.lastConvexUpdate
      ) {
        resolvedValues = { ...mondayValues };
      } else {
        resolvedValues = { ...convexValues };
      }
      break;

    case "monday_wins":
      // Always use Monday.com values
      resolvedValues = { ...mondayValues };
      break;

    case "convex_wins":
      // Always use Convex values
      resolvedValues = { ...convexValues };
      break;

    case "manual":
      // Use manually provided resolution
      if (!options?.manualResolution) {
        return {
          success: false,
          resolvedValues: {},
          error: "Manual resolution strategy requires resolvedValues",
        };
      }
      resolvedValues = options.manualResolution;
      resolutionStatus = "resolved_manual";
      break;

    default:
      return {
        success: false,
        resolvedValues: {},
        error: `Unknown resolution strategy: ${String(strategy)}`,
      };
  }

  const now = Date.now();

  // Update the conflict record
  await ctx.db.patch(conflictId, {
    resolvedAt: now,
    status: resolutionStatus,
    resolutionStrategy: strategy,
    resolvedBy: options?.resolvedBy ?? "system",
    resolvedValues: JSON.stringify(resolvedValues),
  });

  // Log the resolution
  if (options?.syncLogId) {
    await logMessage(
      ctx,
      options.syncLogId,
      "info",
      `Conflict ${conflictId} resolved using ${strategy} strategy`,
      {
        conflictId,
        strategy,
        resolvedBy: options?.resolvedBy ?? "system",
      },
    );
  }

  // Apply the changes if requested
  if (options?.applyChanges) {
    try {
      // Apply to both systems - implementation depends on your system
      // This will be implemented in the sync module
    } catch (error) {
      // Log error but still return success as resolution is recorded
      if (options?.syncLogId) {
        await logError(
          ctx,
          options.syncLogId,
          `Error applying conflict resolution: ${error}`,
        );
      }
    }
  }

  return {
    success: true,
    resolvedValues,
  };
}

/**
 * Get conflicts for a specific board mapping
 */
export async function getConflictsForBoardMapping(
  ctx: MutationCtx,
  boardMappingId: Id<"mondayBoardMappings">,
  options?: {
    status?: ConflictStatus;
    limit?: number;
    onlyUnresolved?: boolean;
  },
) {
  let query = ctx.db
    .query("mondaySyncConflicts")
    .withIndex("by_board_mapping", (q) =>
      q.eq("boardMappingId", boardMappingId),
    );

  // Filter by status if provided
  if (options?.status) {
    query = query.filter((q) => q.eq(q.field("status"), options.status));
  } else if (options?.onlyUnresolved) {
    // Filter for unresolved conflicts
    query = query.filter((q) => q.eq(q.field("status"), "detected"));
  }

  // Apply limit if provided
  if (options?.limit) {
    return await query.take(options.limit);
  }

  return await query.collect();
}

/**
 * Get conflicts for a specific item mapping
 */
export async function getConflictsForItem(
  ctx: MutationCtx,
  itemMappingId: Id<"mondayItemMappings">,
  options?: {
    onlyUnresolved?: boolean;
  },
) {
  let query = ctx.db
    .query("mondaySyncConflicts")
    .withIndex("by_item_mapping", (q) => q.eq("itemMappingId", itemMappingId));

  // Filter for unresolved conflicts if requested
  if (options?.onlyUnresolved) {
    query = query.filter((q) => q.eq(q.field("status"), "detected"));
  }

  return await query.collect();
}

/**
 * Handle bidirectional sync with conflict detection
 */
export async function syncWithConflictDetection(
  ctx: MutationCtx,
  integration: MondayIntegration,
  boardMapping: MondayBoardMapping,
  columnMappings: MondayColumnMapping[],
  itemMapping: MondayItemMapping,
  mondayData: Record<string, unknown>,
  convexData: Record<string, unknown>,
  options?: {
    defaultStrategy?: ConflictResolutionStrategy;
    syncLogId?: Id<"mondaySyncLogs">;
    lastMondayUpdate?: number;
    lastConvexUpdate?: number;
  },
): Promise<{
  success: boolean;
  hasConflicts: boolean;
  conflictId?: Id<"mondaySyncConflicts">;
  resolvedValues?: Record<string, unknown>;
  error?: string;
}> {
  // Default strategy
  const defaultStrategy = options?.defaultStrategy || "latest_wins";

  // 1. Detect conflicts
  const conflicts = detectConflicts(
    mondayData,
    convexData,
    itemMapping.lastSyncTimestamp,
    options?.lastMondayUpdate,
    options?.lastConvexUpdate,
  );

  // No conflicts detected, no action needed
  if (!conflicts.hasConflicts) {
    return {
      success: true,
      hasConflicts: false,
    };
  }

  // 2. Create conflict record
  const conflictId = await createConflictRecord(
    ctx,
    boardMapping,
    itemMapping,
    conflicts.conflictingFields,
    mondayData,
    convexData,
    {
      syncLogId: options?.syncLogId,
      lastMondayUpdate: options?.lastMondayUpdate,
      lastConvexUpdate: options?.lastConvexUpdate,
    },
  );

  // 3. Apply automatic resolution if not using manual strategy
  if (defaultStrategy !== "manual") {
    const resolution = await resolveConflict(ctx, conflictId, defaultStrategy, {
      syncLogId: options?.syncLogId,
      applyChanges: false, // We'll handle applying changes at a higher level
    });

    if (!resolution.success) {
      return {
        success: false,
        hasConflicts: true,
        conflictId,
        error: resolution.error,
      };
    }

    return {
      success: true,
      hasConflicts: true,
      conflictId,
      resolvedValues: resolution.resolvedValues,
    };
  }

  // Using manual strategy - just return the conflict ID
  return {
    success: true,
    hasConflicts: true,
    conflictId,
  };
}
