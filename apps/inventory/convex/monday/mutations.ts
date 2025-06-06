/**
 * Monday.com Integration Mutations
 *
 * This module contains mutation functions for the Monday.com integration.
 * Mutations are used for operations that modify data in the Convex database.
 */

import { Doc, Id } from "../_generated/dataModel";
import { api, internal } from "../_generated/api";
import {
  calculateSyncMetrics as calculateSyncMetricsHelper,
  createSyncLog as createSyncLogHelper,
  endSyncPhase as endSyncPhaseHelper,
  logError as logErrorHelper,
  logMessage as logMessageHelper,
  logPerformanceMetric as logPerformanceMetricHelper,
  logRecordChange as logRecordChangeHelper,
  logSyncPhase as logSyncPhaseHelper,
  updateSyncLog as updateSyncLogHelper,
} from "./lib/logging";
import {
  createSyncLog as createSyncLogFunc,
  performOptimizedPullSync,
  performOptimizedPushSync,
  pullSyncFromMonday,
  pushSyncToMonday,
  updateSyncLog as updateSyncLogFunc,
} from "./lib/sync";
import { internalMutation, mutation } from "../_generated/server";

import { SyncStatus } from "./lib/types";
import { syncOrderToMonday } from "./lib/orderSync";
import { v } from "convex/values";

// Type for the result of sync operations
interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  error?: string;
  errorDetails?: string;
  hasMorePages?: boolean;
  nextPage?: number;
  message?: string;
}

/**
 * Update integration's last sync timestamp
 */
export const updateIntegrationLastSync = mutation({
  args: {
    configId: v.id("mondayIntegration"),
    lastSyncTimestamp: v.number(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.configId, {
      lastSyncTimestamp: args.lastSyncTimestamp,
    });
    return true;
  },
});

/**
 * Update sync log with results
 */
export const updateSyncLog = mutation({
  args: {
    logId: v.id("mondaySyncLogs"),
    status: v.string(),
    recordsProcessed: v.optional(v.number()),
    recordsCreated: v.optional(v.number()),
    recordsUpdated: v.optional(v.number()),
    recordsFailed: v.optional(v.number()),
    error: v.optional(v.string()),
    errorDetails: v.optional(v.string()),
    endTimestamp: v.number(),
  },
  returns: v.id("mondaySyncLogs"),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.logId, {
      status: args.status,
      recordsProcessed: args.recordsProcessed,
      recordsCreated: args.recordsCreated,
      recordsUpdated: args.recordsUpdated,
      recordsFailed: args.recordsFailed,
      error: args.error,
      errorDetails: args.errorDetails,
      endTimestamp: args.endTimestamp,
    });
    return args.logId;
  },
});

/**
 * Create a board mapping (linking Convex table to Monday.com board)
 */
export const createBoardMapping = mutation({
  args: {
    integrationId: v.id("mondayIntegration"),
    mondayBoardId: v.string(),
    mondayBoardName: v.string(),
    convexTableName: v.string(),
    convexTableDisplayName: v.optional(v.string()),
    syncDirection: v.optional(
      v.union(v.literal("push"), v.literal("pull"), v.literal("bidirectional")),
    ),
    isEnabled: v.optional(v.boolean()),
    supportsSubitems: v.optional(v.boolean()),
  },
  returns: v.id("mondayBoardMappings"),
  handler: async (ctx, args) => {
    // Make sure the integration exists
    const integration = await ctx.db.get(args.integrationId);
    if (!integration) {
      throw new Error(`Integration with ID ${args.integrationId} not found`);
    }

    // Create a new mapping
    return await ctx.db.insert("mondayBoardMappings", {
      convexTableName: args.convexTableName,
      convexTableDisplayName:
        args.convexTableDisplayName ?? args.convexTableName,
      mondayBoardId: args.mondayBoardId,
      mondayBoardName: args.mondayBoardName,
      integrationId: args.integrationId,
      syncDirection: args.syncDirection ?? "push",
      isEnabled: args.isEnabled ?? true,
      supportsSubitems: args.supportsSubitems ?? false,
      lastSyncTimestamp: Date.now(),
    });
  },
});

/**
 * Update a board mapping's fields
 */
export const updateBoardMapping = mutation({
  args: {
    id: v.id("mondayBoardMappings"),
    isEnabled: v.optional(v.boolean()),
    syncDirection: v.optional(
      v.union(v.literal("push"), v.literal("pull"), v.literal("bidirectional")),
    ),
    supportsSubitems: v.optional(v.boolean()),
    syncSettings: v.optional(v.string()),
    convexTableDisplayName: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    try {
      const { id, ...updateFields } = args;

      // Only include the fields that were passed
      const fields: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(updateFields)) {
        fields[key] = value;
      }

      // Update the mapping with the provided fields
      await ctx.db.patch(id, fields);
      return true;
    } catch (error) {
      console.error("Error updating board mapping:", error);
      return false;
    }
  },
});

/**
 * Delete a board mapping
 */
export const deleteBoardMapping = mutation({
  args: {
    id: v.id("mondayBoardMappings"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    try {
      // Delete the mapping
      await ctx.db.delete(args.id);
      return true;
    } catch (error) {
      console.error("Error deleting board mapping:", error);
      return false;
    }
  },
});

/**
 * Save (create or update) a column mapping for a board mapping
 */
export const saveColumnMapping = mutation({
  args: {
    id: v.optional(v.id("mondayColumnMappings")),
    boardMappingId: v.id("mondayBoardMappings"),
    mondayColumnId: v.string(),
    mondayColumnTitle: v.string(),
    mondayColumnType: v.string(),
    convexField: v.string(),
    convexFieldType: v.string(),
    isRequired: v.boolean(),
    isEnabled: v.boolean(),
    isPrimaryKey: v.boolean(),
    defaultValue: v.optional(v.string()),
    transformationRule: v.optional(v.string()),
    mappingConfig: v.optional(v.string()),
    formatConfig: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.id) {
      // Update existing mapping
      await ctx.db.patch(args.id, {
        boardMappingId: args.boardMappingId,
        mondayColumnId: args.mondayColumnId,
        mondayColumnTitle: args.mondayColumnTitle,
        mondayColumnType: args.mondayColumnType,
        convexField: args.convexField,
        convexFieldType: args.convexFieldType,
        isRequired: args.isRequired,
        isEnabled: args.isEnabled,
        isPrimaryKey: args.isPrimaryKey,
        defaultValue: args.defaultValue,
        transformationRule: args.transformationRule,
        mappingConfig: args.mappingConfig,
        formatConfig: args.formatConfig,
      });

      return args.id;
    } else {
      // Create new mapping
      return await ctx.db.insert("mondayColumnMappings", {
        boardMappingId: args.boardMappingId,
        mondayColumnId: args.mondayColumnId,
        mondayColumnTitle: args.mondayColumnTitle,
        mondayColumnType: args.mondayColumnType,
        convexField: args.convexField,
        convexFieldType: args.convexFieldType,
        isRequired: args.isRequired,
        isEnabled: args.isEnabled,
        isPrimaryKey: args.isPrimaryKey,
        defaultValue: args.defaultValue,
        transformationRule: args.transformationRule,
        mappingConfig: args.mappingConfig,
        formatConfig: args.formatConfig,
      });
    }
  },
});

/**
 * Delete a column mapping
 */
export const deleteColumnMapping = mutation({
  args: {
    id: v.id("mondayColumnMappings"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    try {
      await ctx.db.delete(args.id);
      return true;
    } catch (error) {
      console.error("Error deleting column mapping:", error);
      return false;
    }
  },
});

/**
 * Log a sync operation
 */
export const logSync = mutation({
  args: {
    operation: v.string(),
    status: v.string(),
    boardMappingId: v.optional(v.id("mondayBoardMappings")),
    convexTable: v.optional(v.string()),
    mondayBoardId: v.optional(v.string()),
    recordsProcessed: v.optional(v.number()),
    recordsCreated: v.optional(v.number()),
    recordsUpdated: v.optional(v.number()),
    recordsFailed: v.optional(v.number()),
    error: v.optional(v.string()),
    errorDetails: v.optional(v.string()),
  },
  returns: v.id("mondaySyncLogs"),
  handler: async (ctx, args) => {
    const now = Date.now();

    const logId = await ctx.db.insert("mondaySyncLogs", {
      operation: args.operation,
      startTimestamp: now,
      endTimestamp: now,
      status: args.status,
      boardMappingId: args.boardMappingId,
      convexTable: args.convexTable,
      mondayBoardId: args.mondayBoardId,
      recordsProcessed: args.recordsProcessed,
      recordsCreated: args.recordsCreated,
      recordsUpdated: args.recordsUpdated,
      recordsFailed: args.recordsFailed,
      error: args.error,
      errorDetails: args.errorDetails,
    });

    return logId;
  },
});

/**
 * Create a new Monday.com integration
 */
export const createIntegration = mutation({
  args: {
    name: v.string(),
    apiKey: v.string(),
    isEnabled: v.boolean(),
    autoSyncIntervalMinutes: v.optional(v.number()),
  },
  returns: v.object({
    integrationId: v.id("mondayIntegration"),
  }),
  handler: async (ctx, args) => {
    // Create the integration with default values
    const integrationId = await ctx.db.insert("mondayIntegration", {
      apiKey: args.apiKey,
      workspaceId: "",
      workspaceName: args.name,
      isEnabled: args.isEnabled,
      autoSyncIntervalMinutes: args.autoSyncIntervalMinutes ?? 60,
      lastConnectionCheck: Date.now(),
      connectionStatus: "pending",
    });

    // Schedule a test connection to update workspace info
    await ctx.scheduler.runAfter(
      0,
      internal.monday.actions.testAndUpdateConnection,
      {
        integrationId,
        apiKey: args.apiKey,
      },
    );

    return { integrationId };
  },
});

/**
 * Update an existing Monday.com integration
 */
export const updateIntegration = internalMutation({
  args: {
    id: v.optional(v.id("mondayIntegration")),
    apiKey: v.string(),
    workspaceId: v.string(),
    workspaceName: v.string(),
    isEnabled: v.optional(v.boolean()),
    autoSyncIntervalMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    if (args.id) {
      // Update existing integration
      await ctx.db.patch(args.id, {
        apiKey: args.apiKey,
        workspaceId: args.workspaceId,
        workspaceName: args.workspaceName,
        isEnabled: args.isEnabled ?? true,
        lastConnectionCheck: now,
        connectionStatus: "connected",
        ...(args.autoSyncIntervalMinutes && {
          autoSyncIntervalMinutes: args.autoSyncIntervalMinutes,
        }),
      });

      return args.id;
    } else {
      // Create new integration
      return await ctx.db.insert("mondayIntegration", {
        apiKey: args.apiKey,
        workspaceId: args.workspaceId,
        workspaceName: args.workspaceName,
        isEnabled: args.isEnabled ?? true,
        lastConnectionCheck: now,
        connectionStatus: "connected",
        ...(args.autoSyncIntervalMinutes && {
          autoSyncIntervalMinutes: args.autoSyncIntervalMinutes,
        }),
      });
    }
  },
});

/**
 * Update the connection status for a Monday.com integration
 */
export const updateConnectionStatus = internalMutation({
  args: {
    id: v.id("mondayIntegration"),
    status: v.string(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const updates: Record<string, unknown> = {
      lastConnectionCheck: now,
      connectionStatus: args.status,
    };

    if (args.error) {
      updates.lastError = args.error;
      updates.consecutiveErrorCount =
        ((await ctx.db.get(args.id))?.consecutiveErrorCount ?? 0) + 1;
    } else {
      updates.consecutiveErrorCount = 0;
      updates.lastError = null;
    }

    await ctx.db.patch(args.id, updates);

    return args.id;
  },
});

/**
 * Create a mapping between Convex and Monday.com item
 */
export const createItemMapping = mutation({
  args: {
    convexTable: v.string(),
    convexId: v.string(),
    mondayBoardId: v.string(),
    mondayItemId: v.string(),
    boardMappingId: v.id("mondayBoardMappings"),
    syncStatus: v.string(),
    isSubitem: v.optional(v.boolean()),
    parentItemId: v.optional(v.string()),
  },
  returns: v.id("mondayItemMappings"),
  handler: async (ctx, args) => {
    // Check if mapping already exists
    const existingMapping = await ctx.db
      .query("mondayItemMappings")
      .withIndex("by_convex_id", (q) =>
        q.eq("convexTable", args.convexTable).eq("convexId", args.convexId),
      )
      .first();

    if (existingMapping) {
      // Update existing mapping
      await ctx.db.patch(existingMapping._id, {
        mondayItemId: args.mondayItemId,
        lastSyncTimestamp: Date.now(),
        syncStatus: args.syncStatus,
        isSubitem: args.isSubitem ?? false,
        parentItemId: args.parentItemId,
      });
      return existingMapping._id;
    }

    // Create new mapping
    return await ctx.db.insert("mondayItemMappings", {
      convexTable: args.convexTable,
      convexId: args.convexId,
      mondayBoardId: args.mondayBoardId,
      mondayItemId: args.mondayItemId,
      boardMappingId: args.boardMappingId,
      lastSyncTimestamp: Date.now(),
      syncStatus: args.syncStatus,
      isSubitem: args.isSubitem ?? false,
      parentItemId: args.parentItemId,
    });
  },
});

/**
 * Update advanced board mapping settings
 */
export const updateBoardSettings = mutation({
  args: {
    id: v.id("mondayBoardMappings"),
    supportsSubitems: v.optional(v.boolean()),
    syncSettings: v.optional(v.string()),
    isEnabled: v.optional(v.boolean()),
    syncDirection: v.optional(
      v.union(v.literal("push"), v.literal("pull"), v.literal("bidirectional")),
    ),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const { id } = args;

      // Check if mapping exists
      const mapping = await ctx.db.get(id);
      if (!mapping) {
        return {
          success: false,
          message: `Board mapping with ID ${id} not found`,
        };
      }

      // Create an update object with only the fields that are provided
      const updates: Record<string, unknown> = {};

      if (args.supportsSubitems !== undefined) {
        updates.supportsSubitems = args.supportsSubitems;
      }

      if (args.syncSettings !== undefined) {
        updates.syncSettings = args.syncSettings;
      }

      if (args.isEnabled !== undefined) {
        updates.isEnabled = args.isEnabled;
      }

      if (args.syncDirection !== undefined) {
        updates.syncDirection = args.syncDirection;
      }

      // Add last updated timestamp
      updates.lastSyncTimestamp = Date.now();

      // Apply the updates
      await ctx.db.patch(id, updates);

      return {
        success: true,
        message: "Board settings updated successfully",
      };
    } catch (error) {
      console.error("Error updating board settings:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Sync a specific board with Monday.com
 */
export const syncBoard = mutation({
  args: {
    boardMappingId: v.id("mondayBoardMappings"),
    direction: v.optional(
      v.union(v.literal("pull"), v.literal("push"), v.literal("both")),
    ),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Validate inputs
      const boardMapping = await ctx.db.get(args.boardMappingId);
      if (!boardMapping) {
        return {
          success: false,
          message: "Board mapping not found",
        };
      }

      // Get the integration
      const integration = await ctx.db.get(boardMapping.integrationId);
      if (!integration) {
        return {
          success: false,
          message: "Integration configuration not found",
        };
      }

      if (!integration.isEnabled) {
        return {
          success: false,
          message: "Monday.com integration is disabled",
        };
      }

      // Check if the board mapping is enabled
      if (!boardMapping.isEnabled) {
        return {
          success: false,
          message: "Board mapping is disabled",
        };
      }

      const direction = args.direction || "both";
      let pullResult = { success: true, message: "" };
      let pushResult = { success: true, message: "" };

      // Pull data from Monday.com to Convex
      if (direction === "pull" || direction === "both") {
        const syncLogId = await createSyncLogFunc(
          ctx,
          "Board pull sync",
          "in-progress",
          {
            boardMappingId: args.boardMappingId,
            mondayBoardId: boardMapping.mondayBoardId,
          },
        );

        try {
          const result = await ctx.runMutation(
            internal.monday.mutations.executePullSync,
            {
              integrationId: integration._id,
              boardMappingId: args.boardMappingId,
              syncLogId,
            },
          );

          pullResult = {
            success: result.success,
            message: result.message,
          };
        } catch (error) {
          pullResult = {
            success: false,
            message:
              error instanceof Error
                ? error.message
                : "Unknown error during pull sync",
          };
        }
      }

      // Push data from Convex to Monday.com (if this is an order board mapping)
      if (
        (direction === "push" || direction === "both") &&
        boardMapping.convexTableName === "orders"
      ) {
        const syncLogId = await createSyncLogFunc(
          ctx,
          "Order push sync",
          "in-progress",
          {
            boardMappingId: args.boardMappingId,
            mondayBoardId: boardMapping.mondayBoardId,
          },
        );

        try {
          // Import from local file to avoid circular dependencies
          const { batchSyncOrdersToMonday } = await import("./lib/orderSync");

          // Get the column mappings
          const columnMappings = await ctx.db
            .query("mondayColumnMappings")
            .withIndex("by_board_mapping", (q) =>
              q.eq("boardMappingId", args.boardMappingId),
            )
            .collect();

          if (columnMappings.length === 0) {
            pushResult = {
              success: false,
              message: "No column mappings found for this board",
            };
          } else {
            // Batch sync orders to Monday.com
            const result = await batchSyncOrdersToMonday(
              ctx,
              integration,
              boardMapping,
              columnMappings,
              10, // Limit to 10 orders at a time
            );

            pushResult = {
              success: result.success,
              message: result.message,
            };
          }
        } catch (error) {
          pushResult = {
            success: false,
            message:
              error instanceof Error
                ? error.message
                : "Unknown error during push sync",
          };
        }
      }

      // Determine overall success and message
      const success =
        (direction === "pull" ? pullResult.success : true) &&
        (direction === "push" ? pushResult.success : true) &&
        (direction === "both"
          ? pullResult.success && pushResult.success
          : true);

      let message = "";
      if (direction === "pull") {
        message = pullResult.message;
      } else if (direction === "push") {
        message = pushResult.message;
      } else {
        message = `Pull: ${pullResult.message}, Push: ${pushResult.message}`;
      }

      // Update the integration's last sync timestamp
      await ctx.db.patch(integration._id, {
        lastSyncTimestamp: Date.now(),
      });

      return {
        success,
        message,
      };
    } catch (error) {
      console.error("Error syncing board:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Sync a specific order with Monday.com
 */
export const syncOrder = mutation({
  args: {
    orderId: v.id("orders"),
    boardMappingId: v.id("mondayBoardMappings"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    orderSynced: v.boolean(),
    lineItemsSynced: v.number(),
    lineItemsFailed: v.number(),
  }),
  handler: async (ctx, args) => {
    try {
      // Validate inputs
      const boardMapping = await ctx.db.get(args.boardMappingId);
      if (!boardMapping) {
        return {
          success: false,
          message: "Board mapping not found",
          orderSynced: false,
          lineItemsSynced: 0,
          lineItemsFailed: 0,
        };
      }

      // Get the integration
      const integration = await ctx.db.get(boardMapping.integrationId);
      if (!integration) {
        return {
          success: false,
          message: "Integration configuration not found",
          orderSynced: false,
          lineItemsSynced: 0,
          lineItemsFailed: 0,
        };
      }

      if (!integration.isEnabled) {
        return {
          success: false,
          message: "Monday.com integration is disabled",
          orderSynced: false,
          lineItemsSynced: 0,
          lineItemsFailed: 0,
        };
      }

      // Check if the board mapping is enabled
      if (!boardMapping.isEnabled) {
        return {
          success: false,
          message: "Board mapping is disabled",
          orderSynced: false,
          lineItemsSynced: 0,
          lineItemsFailed: 0,
        };
      }

      // Create a sync log for this operation
      const syncLogId = await createSyncLogFunc(
        ctx,
        "Order push sync",
        "in-progress",
        {
          boardMappingId: args.boardMappingId,
          mondayBoardId: boardMapping.mondayBoardId,
          convexTable: "orders",
        },
      );

      // Get the column mappings
      const columnMappings = await ctx.db
        .query("mondayColumnMappings")
        .withIndex("by_board_mapping", (q) =>
          q.eq("boardMappingId", args.boardMappingId),
        )
        .collect();

      if (columnMappings.length === 0) {
        await updateSyncLogFunc(ctx, syncLogId, "failed", {
          error: "No column mappings found for this board",
        });

        return {
          success: false,
          message: "No column mappings found for this board",
          orderSynced: false,
          lineItemsSynced: 0,
          lineItemsFailed: 0,
        };
      }

      // Mark the order as being synced
      await ctx.db.patch(args.orderId, {
        mondaySyncStatus: "syncing",
      });

      // Import from local file to avoid circular dependencies
      const { syncOrderToMonday } = await import("./lib/orderSync");

      // Sync the order to Monday.com
      const result = await syncOrderToMonday(
        ctx,
        integration,
        boardMapping,
        columnMappings,
        args.orderId,
      );

      // Update the sync log with results
      await updateSyncLogFunc(
        ctx,
        syncLogId,
        result.success ? "completed" : "failed",
        {
          recordsProcessed: 1 + result.lineItemsSynced + result.lineItemsFailed,
          recordsCreated: result.orderSynced ? 1 : 0,
          recordsUpdated: result.lineItemsSynced,
          recordsFailed: result.lineItemsFailed,
          error: result.success ? undefined : result.message,
        },
      );

      return result;
    } catch (error) {
      console.error("Error syncing order:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        orderSynced: false,
        lineItemsSynced: 0,
        lineItemsFailed: 0,
      };
    }
  },
});

/**
 * Batch sync orders with Monday.com
 */
export const batchSyncOrders = mutation({
  args: {
    boardMappingId: v.id("mondayBoardMappings"),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    ordersProcessed: v.number(),
    ordersSynced: v.number(),
    ordersFailed: v.number(),
  }),
  handler: async (ctx, args) => {
    try {
      // Validate inputs
      const boardMapping = await ctx.db.get(args.boardMappingId);
      if (!boardMapping) {
        return {
          success: false,
          message: "Board mapping not found",
          ordersProcessed: 0,
          ordersSynced: 0,
          ordersFailed: 0,
        };
      }

      // Get the integration
      const integration = await ctx.db.get(boardMapping.integrationId);
      if (!integration) {
        return {
          success: false,
          message: "Integration configuration not found",
          ordersProcessed: 0,
          ordersSynced: 0,
          ordersFailed: 0,
        };
      }

      if (!integration.isEnabled) {
        return {
          success: false,
          message: "Monday.com integration is disabled",
          ordersProcessed: 0,
          ordersSynced: 0,
          ordersFailed: 0,
        };
      }

      // Check if the board mapping is enabled
      if (!boardMapping.isEnabled) {
        return {
          success: false,
          message: "Board mapping is disabled",
          ordersProcessed: 0,
          ordersSynced: 0,
          ordersFailed: 0,
        };
      }

      // Create a sync log for this operation
      const syncLogId = await createSyncLogFunc(
        ctx,
        "Batch order push sync",
        "in-progress",
        {
          boardMappingId: args.boardMappingId,
          mondayBoardId: boardMapping.mondayBoardId,
          convexTable: "orders",
        },
      );

      // Get the column mappings
      const columnMappings = await ctx.db
        .query("mondayColumnMappings")
        .withIndex("by_board_mapping", (q) =>
          q.eq("boardMappingId", args.boardMappingId),
        )
        .collect();

      if (columnMappings.length === 0) {
        await updateSyncLogFunc(ctx, syncLogId, "failed", {
          error: "No column mappings found for this board",
        });

        return {
          success: false,
          message: "No column mappings found for this board",
          ordersProcessed: 0,
          ordersSynced: 0,
          ordersFailed: 0,
        };
      }

      // Import from local file to avoid circular dependencies
      const { batchSyncOrdersToMonday } = await import("./lib/orderSync");

      // Batch sync orders to Monday.com
      const result = await batchSyncOrdersToMonday(
        ctx,
        integration,
        boardMapping,
        columnMappings,
        args.limit,
      );

      // Update the sync log with results
      await updateSyncLogFunc(
        ctx,
        syncLogId,
        result.success ? "completed" : "failed",
        {
          recordsProcessed: result.ordersProcessed,
          recordsCreated: result.ordersSynced,
          recordsUpdated: 0,
          recordsFailed: result.ordersFailed,
          error: result.success ? undefined : result.message,
        },
      );

      return result;
    } catch (error) {
      console.error("Error in batch sync orders:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        ordersProcessed: 0,
        ordersSynced: 0,
        ordersFailed: 0,
      };
    }
  },
});

/**
 * Sync all orders with Monday.com
 */
export const syncAllOrders = mutation({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    boardsMapped: v.number(),
    ordersProcessed: v.number(),
  }),
  handler: async (ctx, args) => {
    try {
      // Get the integration
      const integration = await ctx.db
        .query("mondayIntegration")
        .order("desc")
        .first();

      if (!integration) {
        return {
          success: false,
          message: "Monday.com integration is not configured",
          boardsMapped: 0,
          ordersProcessed: 0,
        };
      }

      if (!integration.isEnabled) {
        return {
          success: false,
          message: "Monday.com integration is not enabled",
          boardsMapped: 0,
          ordersProcessed: 0,
        };
      }

      // Get active board mappings for orders table
      const boardMappings = await ctx.db
        .query("mondayBoardMappings")
        .filter((q) =>
          q.and(
            q.eq(q.field("isEnabled"), true),
            q.eq(q.field("convexTableName"), "orders"),
          ),
        )
        .collect();

      if (boardMappings.length === 0) {
        return {
          success: false,
          message: "No active board mappings found for orders",
          boardsMapped: 0,
          ordersProcessed: 0,
        };
      }

      // Start a batch sync for each board mapping with a small delay
      let delay = 0;
      for (const mapping of boardMappings) {
        await ctx.scheduler.runAfter(
          delay,
          api.monday.mutations.batchSyncOrders,
          {
            boardMappingId: mapping._id,
            limit: args.limit,
          },
        );
        delay += 2000; // Add 2 seconds between each sync
      }

      // Update integration's last sync timestamp
      await ctx.db.patch(integration._id, {
        lastSyncTimestamp: Date.now(),
      });

      return {
        success: true,
        message: `Started batch sync for ${boardMappings.length} order board mappings`,
        boardsMapped: boardMappings.length,
        ordersProcessed: 0, // We don't know yet how many will be processed
      };
    } catch (error) {
      console.error("Error syncing all orders:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        boardsMapped: 0,
        ordersProcessed: 0,
      };
    }
  },
});

/**
 * Sync all boards with Monday.com
 */
export const syncAllBoards = mutation({
  args: {
    direction: v.optional(
      v.union(v.literal("pull"), v.literal("push"), v.literal("both")),
    ),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    boardsMapped: v.number(),
  }),
  handler: async (ctx, args) => {
    try {
      // Get integration configuration
      const integration = await ctx.db
        .query("mondayIntegration")
        .order("desc")
        .first();

      if (!integration) {
        return {
          success: false,
          message: "Monday.com integration is not configured",
          boardsMapped: 0,
        };
      }

      if (!integration.isEnabled) {
        return {
          success: false,
          message: "Monday.com integration is not enabled",
          boardsMapped: 0,
        };
      }

      const direction = args.direction || "both";

      // Create a sync log for the batch operation
      const syncLogId = await createSyncLogFunc(
        ctx,
        "Auto sync all",
        "in-progress",
        {},
      );

      // Get active board mappings (filter by type based on direction)
      let filter = (q: any) => q.eq(q.field("isEnabled"), true);

      if (direction === "push") {
        // For push, we only care about board mappings for tables that can be pushed to Monday
        filter = (q: any) =>
          q.and(
            q.eq(q.field("isEnabled"), true),
            q.eq(q.field("convexTableName"), "orders"),
          );
      }

      const boardMappings = await ctx.db
        .query("mondayBoardMappings")
        .filter(filter)
        .collect();

      if (boardMappings.length === 0) {
        await updateSyncLogFunc(ctx, syncLogId, "failed", {
          error: "No active board mappings found",
        });

        return {
          success: false,
          message: "No active board mappings found",
          boardsMapped: 0,
        };
      }

      // Start a sync for each board mapping with a small delay between each
      let delay = 0;
      for (const mapping of boardMappings) {
        if (mapping?._id) {
          // Skip boards that don't support the requested direction
          if (direction === "push" && mapping.convexTableName !== "orders") {
            continue;
          }

          // Start the sync with the specified direction
          await ctx.scheduler.runAfter(delay, api.monday.mutations.syncBoard, {
            boardMappingId: mapping._id,
            direction,
          });
          delay += 1000; // Add 1 second between each sync
        }
      }

      const mappingsCount = boardMappings.length;

      // Mark the overall sync as completed
      await ctx.scheduler.runAfter(
        delay + 2000,
        api.monday.mutations.updateSyncLog,
        {
          logId: syncLogId,
          status: "completed",
          recordsProcessed: mappingsCount,
          endTimestamp: Date.now() + delay + 2000,
        },
      );

      // Update the integration's last sync timestamp
      await ctx.db.patch(integration._id, {
        lastSyncTimestamp: Date.now(),
      });

      return {
        success: true,
        message: `Started ${direction === "pull" ? "pull" : direction === "push" ? "push" : "bidirectional"} sync for ${mappingsCount} board mappings`,
        boardsMapped: mappingsCount,
      };
    } catch (error) {
      console.error("Error in syncAllBoards:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        boardsMapped: 0,
      };
    }
  },
});

/**
 * Start a sync operation and create a sync log
 */
export const startSync = internalMutation({
  args: {
    boardMappingId: v.id("mondayBoardMappings"),
    operation: v.string(),
  },
  handler: async (ctx, args) => {
    // Update board mapping status
    await ctx.db.patch(args.boardMappingId, {
      syncStatus: "syncing",
    });

    // Get the board mapping details
    const boardMapping = await ctx.db.get(args.boardMappingId);

    if (!boardMapping) {
      throw new Error("Board mapping not found");
    }

    // Create a sync log
    return await createSyncLogFunc(ctx, args.operation, "in-progress", {
      boardMappingId: args.boardMappingId,
      mondayBoardId: boardMapping.mondayBoardId,
      convexTable: boardMapping.convexTableName,
    });
  },
});

/**
 * Complete a sync operation with error
 */
export const completeSyncWithError = internalMutation({
  args: {
    syncLogId: v.id("mondaySyncLogs"),
    error: v.string(),
    errorDetails: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Update the sync log
    await updateSyncLogFunc(ctx, args.syncLogId, "failed", {
      error: args.error,
      errorDetails: args.errorDetails,
    });

    // Get the sync log to find the board mapping
    const syncLog = await ctx.db.get(args.syncLogId);

    if (!syncLog || !syncLog.boardMappingId) {
      return;
    }

    // Update the board mapping status
    await ctx.db.patch(syncLog.boardMappingId, {
      syncStatus: "error",
    });

    return args.syncLogId;
  },
});

/**
 * Execute a pull sync operation from Monday.com
 */
export const executePullSync = internalMutation({
  args: {
    integrationId: v.id("mondayIntegration"),
    boardMappingId: v.id("mondayBoardMappings"),
    syncLogId: v.id("mondaySyncLogs"),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    recordsProcessed: v.number(),
    recordsCreated: v.number(),
    recordsUpdated: v.number(),
    recordsFailed: v.number(),
    hasMorePages: v.optional(v.boolean()),
    nextPage: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get the integration
      const integration = await ctx.db.get(args.integrationId);
      if (!integration) {
        throw new Error("Integration not found");
      }

      // Get the board mapping
      const boardMapping = await ctx.db.get(args.boardMappingId);
      if (!boardMapping) {
        throw new Error("Board mapping not found");
      }

      // Get the column mappings
      const columnMappings = await ctx.db
        .query("mondayColumnMappings")
        .withIndex("by_board_mapping", (q) =>
          q.eq("boardMappingId", args.boardMappingId),
        )
        .collect();

      if (columnMappings.length === 0) {
        throw new Error("No column mappings found for this board");
      }

      // Execute the pull sync with pagination support
      const scheduledFunctionId = await ctx.scheduler.runAfter(
        0,
        internal.monday.mutations.executePullSync,
        {
          integrationId: integration._id,
          boardMappingId: args.boardMappingId,
          syncLogId,
          page: args.page,
          limit: args.limit,
        },
      );

      // Get the result of the scheduled function
      // Note: In a real implementation, we would need to use a callback or other mechanism
      // to get the result of the scheduled function. For now, we'll simulate it by
      // fetching the sync log.
      const syncLog = await ctx.db.get(syncLogId);
      if (!syncLog) {
        throw new Error("Sync log not found");
      }

      // Create a result object from the sync log
      const result = {
        hasMorePages: false, // Default to false, would be set by the actual function
        recordsProcessed: syncLog.recordsProcessed ?? 0,
        recordsCreated: syncLog.recordsCreated ?? 0,
        recordsUpdated: syncLog.recordsUpdated ?? 0,
        recordsFailed: syncLog.recordsFailed ?? 0,
        success: syncLog.status === "completed",
      };

      // Check if we need to continue with the next page
      const hasMorePages = result.hasMorePages ?? false;
      const nextPage = args.page ?? 1 + 1;

      // Update the sync log with the results
      await updateSyncLogFunc(
        ctx,
        syncLogId,
        result.success ? "completed" : "failed",
        {
          recordsProcessed: result.recordsProcessed,
          recordsCreated: result.recordsCreated,
          recordsUpdated: result.recordsUpdated,
          recordsFailed: result.recordsFailed,
          error: result.success ? undefined : result.message,
        },
      );

      // Return the results
      return {
        success: result.success,
        message: result.success
          ? `Sync completed: ${result.recordsCreated} created, ${result.recordsUpdated} updated, ${result.recordsFailed} failed`
          : result.message || "Sync failed",
        recordsProcessed: result.recordsProcessed,
        recordsCreated: result.recordsCreated,
        recordsUpdated: result.recordsUpdated,
        recordsFailed: result.recordsFailed,
        hasMorePages,
        nextPage,
      };
    } catch (error) {
      console.error("Error in executePullSync:", error);

      // Update the sync log with the error
      await updateSyncLogFunc(ctx, args.syncLogId, "failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        errorDetails: error instanceof Error ? error.stack : undefined,
      });

      // Update the board mapping status
      await ctx.db.patch(args.boardMappingId, {
        syncStatus: "error",
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsFailed: 0,
      };
    }
  },
});

/**
 * Execute a push sync operation to Monday.com
 */
export const executePushSync = internalMutation({
  args: {
    integrationId: v.id("mondayIntegration"),
    boardMappingId: v.id("mondayBoardMappings"),
    syncLogId: v.id("mondaySyncLogs"),
    updatedSince: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    recordsProcessed: v.number(),
    recordsCreated: v.number(),
    recordsUpdated: v.number(),
    recordsFailed: v.number(),
  }),
  handler: async (ctx, args) => {
    try {
      // Get the integration
      const integration = await ctx.db.get(args.integrationId);
      if (!integration) {
        throw new Error("Integration not found");
      }

      // Get the board mapping
      const boardMapping = await ctx.db.get(args.boardMappingId);
      if (!boardMapping) {
        throw new Error("Board mapping not found");
      }

      // Get the column mappings
      const columnMappings = await ctx.db
        .query("mondayColumnMappings")
        .withIndex("by_board_mapping", (q) =>
          q.eq("boardMappingId", args.boardMappingId),
        )
        .collect();

      if (columnMappings.length === 0) {
        throw new Error("No column mappings found for this board");
      }

      // Execute the push sync
      const result = await pushSyncToMonday(
        ctx,
        integration,
        boardMapping,
        columnMappings,
        {
          limit: args.limit,
          updatedSince: args.updatedSince,
          processSubitems: boardMapping.supportsSubitems,
        },
      );

      // Update the sync log with the results
      await updateSyncLogFunc(
        ctx,
        args.syncLogId,
        result.success ? "completed" : "failed",
        {
          recordsProcessed: result.recordsProcessed,
          recordsCreated: result.recordsCreated,
          recordsUpdated: result.recordsUpdated,
          recordsFailed: result.recordsFailed,
          error: result.error,
          errorDetails: result.errorDetails,
        },
      );

      // Return the results
      return {
        success: result.success,
        message: result.success
          ? `Sync completed: ${result.recordsCreated} created, ${result.recordsUpdated} updated, ${result.recordsFailed} failed`
          : result.error || "Sync failed",
        recordsProcessed: result.recordsProcessed,
        recordsCreated: result.recordsCreated,
        recordsUpdated: result.recordsUpdated,
        recordsFailed: result.recordsFailed,
      };
    } catch (error) {
      console.error("Error in executePushSync:", error);

      // Update the sync log with the error
      await updateSyncLogFunc(ctx, args.syncLogId, "failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        errorDetails: error instanceof Error ? error.stack : undefined,
      });

      // Update the board mapping status
      await ctx.db.patch(args.boardMappingId, {
        syncStatus: "error",
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsFailed: 0,
      };
    }
  },
});

/**
 * Sync a board from Monday.com with pagination support for large boards
 */
export const syncBoardPaginated = mutation({
  args: {
    boardMappingId: v.id("mondayBoardMappings"),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    hasMorePages: v.optional(v.boolean()),
    nextPage: v.optional(v.number()),
    recordsProcessed: v.optional(v.number()),
    recordsCreated: v.optional(v.number()),
    recordsUpdated: v.optional(v.number()),
    recordsFailed: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    // Validate inputs
    const boardMapping = await ctx.db.get(args.boardMappingId);
    if (!boardMapping) {
      return {
        success: false,
        message: "Board mapping not found",
      };
    }

    // Get the integration
    const integration = await ctx.db.get(boardMapping.integrationId);
    if (!integration) {
      return {
        success: false,
        message: "Integration configuration not found",
      };
    }

    if (!integration.isEnabled) {
      return {
        success: false,
        message: "Monday.com integration is disabled",
      };
    }

    // Set default page and limit
    const page = args.page ?? 1;
    const limit = args.limit ?? 100;

    // Determine the sync direction based on the board mapping
    const syncDirection = boardMapping.syncDirection;

    // Create a sync log for this operation
    const syncLogId = await ctx.scheduler.runAfter(
      0,
      internal.monday.mutations.startSync,
      {
        boardMappingId: args.boardMappingId,
        operation: `${syncDirection === "push" ? "Push" : "Pull"} sync ${syncDirection === "pull" ? `(page ${page})` : ""}`,
      },
    );

    try {
      // Update board mapping status
      await ctx.db.patch(args.boardMappingId, {
        syncStatus: "syncing",
      });

      // Check if we need to run a pull or push sync
      if (syncDirection === "pull" || syncDirection === "bidirectional") {
        // Get column mappings
        const columnMappings = await ctx.db
          .query("mondayColumnMappings")
          .withIndex("by_board_mapping", (q) =>
            q.eq("boardMappingId", args.boardMappingId),
          )
          .collect();

        if (columnMappings.length === 0) {
          await ctx.scheduler.runAfter(
            0,
            internal.monday.mutations.completeSyncWithError,
            {
              syncLogId,
              error: "No column mappings found for this board",
            },
          );

          return {
            success: false,
            message: "No column mappings found for this board",
          };
        }

        // Execute the pull sync for this page
        const scheduledFunctionId = await ctx.scheduler.runAfter(
          0,
          internal.monday.mutations.executePullSync,
          {
            integrationId: integration._id,
            boardMappingId: args.boardMappingId,
            syncLogId,
            page,
            limit,
          },
        );

        // Get the result of the scheduled function
        // Note: In a real implementation, we would need to use a callback or other mechanism
        // to get the result of the scheduled function. For now, we'll simulate it by
        // fetching the sync log.
        const syncLog = await ctx.db.get(syncLogId);
        if (!syncLog) {
          throw new Error("Sync log not found");
        }

        // Create a result object from the sync log
        const result = {
          hasMorePages: false, // Default to false, would be set by the actual function
          recordsProcessed: syncLog.recordsProcessed ?? 0,
          recordsCreated: syncLog.recordsCreated ?? 0,
          recordsUpdated: syncLog.recordsUpdated ?? 0,
          recordsFailed: syncLog.recordsFailed ?? 0,
          success: syncLog.status === "completed",
        };

        // Check if we need to continue with the next page
        const hasMorePages = result.hasMorePages ?? false;
        const nextPage = page + 1;

        // Update the board mapping status if this is a pull-only sync
        if (syncDirection === "pull") {
          await ctx.db.patch(args.boardMappingId, {
            syncStatus: hasMorePages
              ? "syncing"
              : result.recordsFailed > 0
                ? "partial"
                : "synced",
            lastSyncTimestamp: Date.now(),
          });
        }

        // If we have more pages and this is the first page, schedule the next page
        if (hasMorePages && page === 1 && syncDirection === "pull") {
          // Schedule the next page to be synced
          await ctx.scheduler.runAfter(
            1,
            api.monday.mutations.syncBoardPaginated,
            {
              boardMappingId: args.boardMappingId,
              page: nextPage,
              limit,
            },
          );

          return {
            success: true,
            message: `Sync started for page ${page}. More pages will be processed automatically.`,
            hasMorePages,
            nextPage,
            recordsProcessed: result.recordsProcessed,
            recordsCreated: result.recordsCreated,
            recordsUpdated: result.recordsUpdated,
            recordsFailed: result.recordsFailed,
          };
        }

        // If we have more pages but this isn't the first page, return the status
        if (hasMorePages && syncDirection === "pull") {
          return {
            success: true,
            message: `Synced page ${page}. ${result.recordsCreated} created, ${result.recordsUpdated} updated.`,
            hasMorePages,
            nextPage,
            recordsProcessed: result.recordsProcessed,
            recordsCreated: result.recordsCreated,
            recordsUpdated: result.recordsUpdated,
            recordsFailed: result.recordsFailed,
          };
        }

        // For bidirectional sync, continue with push after pull is complete
        if (syncDirection === "bidirectional" && !hasMorePages) {
          // Start push sync
          await ctx.scheduler.runAfter(
            0,
            internal.monday.mutations.executePushSync,
            {
              integrationId: integration._id,
              boardMappingId: args.boardMappingId,
              syncLogId,
              limit,
            },
          );

          return {
            success: true,
            message: "Pull sync completed, starting push sync...",
            recordsProcessed: result.recordsProcessed,
            recordsCreated: result.recordsCreated,
            recordsUpdated: result.recordsUpdated,
            recordsFailed: result.recordsFailed,
          };
        }

        // Final page, sync is complete
        return {
          success: true,
          message: `Sync completed: ${result.recordsCreated} created, ${result.recordsUpdated} updated, ${result.recordsFailed} failed`,
          hasMorePages: false,
          recordsProcessed: result.recordsProcessed,
          recordsCreated: result.recordsCreated,
          recordsUpdated: result.recordsUpdated,
          recordsFailed: result.recordsFailed,
        };
      } else if (syncDirection === "push") {
        // Get column mappings
        const columnMappings = await ctx.db
          .query("mondayColumnMappings")
          .withIndex("by_board_mapping", (q) =>
            q.eq("boardMappingId", args.boardMappingId),
          )
          .collect();

        if (columnMappings.length === 0) {
          await ctx.scheduler.runAfter(
            0,
            internal.monday.mutations.completeSyncWithError,
            {
              syncLogId,
              error: "No column mappings found for this board",
            },
          );

          return {
            success: false,
            message: "No column mappings found for this board",
          };
        }

        // Execute the push sync
        const result = await ctx.scheduler.runAfter(
          0,
          internal.monday.mutations.executePushSync,
          {
            integrationId: integration._id,
            boardMappingId: args.boardMappingId,
            syncLogId,
            limit,
          },
        );

        // Update the board mapping status
        await ctx.db.patch(args.boardMappingId, {
          syncStatus: result.recordsFailed > 0 ? "partial" : "synced",
          lastSyncTimestamp: Date.now(),
        });

        return {
          success: true,
          message: `Push sync completed: ${result.recordsCreated} created, ${result.recordsUpdated} updated, ${result.recordsFailed} failed`,
          recordsProcessed: result.recordsProcessed,
          recordsCreated: result.recordsCreated,
          recordsUpdated: result.recordsUpdated,
          recordsFailed: result.recordsFailed,
        };
      } else {
        await ctx.scheduler.runAfter(
          0,
          internal.monday.mutations.completeSyncWithError,
          {
            syncLogId,
            error: `Invalid sync direction: ${syncDirection}`,
          },
        );

        return {
          success: false,
          message: `Invalid sync direction: ${syncDirection}`,
        };
      }
    } catch (error) {
      console.error("Error in syncBoardPaginated:", error);

      // Update the sync log with the error
      await ctx.scheduler.runAfter(
        0,
        internal.monday.mutations.completeSyncWithError,
        {
          syncLogId,
          error: error instanceof Error ? error.message : "Unknown error",
          errorDetails: error instanceof Error ? error.stack : undefined,
        },
      );

      // Update the board mapping status
      await ctx.db.patch(args.boardMappingId, {
        syncStatus: "error",
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Pull data from Monday.com to Convex
 */
export const pullFromMonday = mutation({
  args: {
    integrationId: v.id("mondayIntegration"),
    boardMappingId: v.id("mondayBoardMappings"),
  },
  handler: async (ctx, args) => {
    // Get integration and board mapping
    const integration = await ctx.db.get(args.integrationId);
    if (!integration) {
      throw new Error("Integration not found");
    }

    const boardMapping = await ctx.db.get(args.boardMappingId);
    if (!boardMapping) {
      throw new Error("Board mapping not found");
    }

    // Get column mappings for the board
    const columnMappings = await ctx.db
      .query("mondayColumnMappings")
      .withIndex("by_board_mapping", (q) =>
        q.eq("boardMappingId", args.boardMappingId),
      )
      .collect();

    // Mark mapping as syncing
    await ctx.db.patch(args.boardMappingId, {
      syncStatus: "syncing",
    });

    try {
      // Pull data from Monday.com
      const result = await pullSyncFromMonday(
        ctx,
        integration,
        boardMapping,
        columnMappings,
      );

      // Update last sync timestamp
      await ctx.db.patch(args.boardMappingId, {
        lastSyncTimestamp: Date.now(),
        syncStatus: result.success ? "synced" : "error",
      });

      return result;
    } catch (error) {
      // Update sync status on error
      await ctx.db.patch(args.boardMappingId, {
        syncStatus: "error",
      });

      throw error;
    }
  },
});

/**
 * Push data from Convex to Monday.com
 */
export const pushToMonday = mutation({
  args: {
    integrationId: v.id("mondayIntegration"),
    boardMappingId: v.id("mondayBoardMappings"),
  },
  handler: async (ctx, args) => {
    // Get integration and board mapping
    const integration = await ctx.db.get(args.integrationId);
    if (!integration) {
      throw new Error("Integration not found");
    }

    const boardMapping = await ctx.db.get(args.boardMappingId);
    if (!boardMapping) {
      throw new Error("Board mapping not found");
    }

    // Get column mappings for the board
    const columnMappings = await ctx.db
      .query("mondayColumnMappings")
      .withIndex("by_board_mapping", (q) =>
        q.eq("boardMappingId", args.boardMappingId),
      )
      .collect();

    // Mark mapping as syncing
    await ctx.db.patch(args.boardMappingId, {
      syncStatus: "syncing",
    });

    try {
      // Check if this is an order mapping (special case for parent-child relationships)
      if (boardMapping.convexTableName === "orders") {
        // For orders, sync related line items as subitems
        const orders = await ctx.db
          .query("orders")
          .filter((q) =>
            q.or(
              q.eq(q.field("mondaySyncStatus"), undefined),
              q.eq(q.field("mondaySyncStatus"), "pending"),
              q.and(
                q.gt(q.field("updatedAt"), boardMapping.lastSyncTimestamp || 0),
                q.or(
                  q.eq(q.field("mondaySyncStatus"), "synced"),
                  q.eq(q.field("mondaySyncStatus"), "partial"),
                ),
              ),
            ),
          )
          .take(50);

        let success = true;
        let ordersSynced = 0;
        let ordersFailed = 0;

        for (const order of orders) {
          try {
            const orderResult = await syncOrderToMonday(
              ctx,
              integration,
              boardMapping,
              columnMappings,
              order._id,
            );

            if (orderResult.success) {
              ordersSynced++;
            } else {
              ordersFailed++;
              success = false;
            }
          } catch (error) {
            ordersFailed++;
            success = false;
            console.error(`Error syncing order ${order._id}:`, error);
          }
        }

        // Update last sync timestamp
        await ctx.db.patch(args.boardMappingId, {
          lastSyncTimestamp: Date.now(),
          syncStatus:
            ordersFailed > 0
              ? ordersSynced > 0
                ? "partial"
                : "error"
              : "synced",
        });

        return {
          success: ordersFailed === 0,
          message: `Processed ${orders.length} orders: ${ordersSynced} synced, ${ordersFailed} failed`,
          itemsProcessed: orders.length,
          itemsSynced: ordersSynced,
          itemsFailed: ordersFailed,
        };
      } else {
        // For standard entities, use the core push function
        const result = await pushSyncToMonday(
          ctx,
          integration,
          boardMapping,
          columnMappings,
        );

        // Update last sync timestamp
        await ctx.db.patch(args.boardMappingId, {
          lastSyncTimestamp: Date.now(),
          syncStatus: result.success ? "synced" : "error",
        });

        return result;
      }
    } catch (error) {
      // Update sync status on error
      await ctx.db.patch(args.boardMappingId, {
        syncStatus: "error",
      });

      throw error;
    }
  },
});

/**
 * Synchronize all enabled mappings
 */
export const syncAll = mutation({
  args: {
    integrationId: v.id("mondayIntegration"),
  },
  handler: async (ctx, args) => {
    // Get integration
    const integration = await ctx.db.get(args.integrationId);
    if (!integration) {
      throw new Error("Integration not found");
    }

    // Get all enabled board mappings
    const boardMappings = await ctx.db
      .query("mondayBoardMappings")
      .withIndex("by_integration", (q) =>
        q.eq("integrationId", args.integrationId),
      )
      .filter((q) => q.eq(q.field("isEnabled"), true))
      .collect();

    let succeeded = 0;
    let failed = 0;

    // Process each mapping
    for (const mapping of boardMappings) {
      try {
        // Get column mappings for the board
        const columnMappings = await ctx.db
          .query("mondayColumnMappings")
          .withIndex("by_board_mapping", (q) =>
            q.eq("boardMappingId", mapping._id),
          )
          .collect();

        // Mark mapping as syncing
        await ctx.db.patch(mapping._id, {
          syncStatus: "syncing",
        });

        // Sync according to mapping direction
        if (
          mapping.syncDirection === "pull" ||
          mapping.syncDirection === "bidirectional"
        ) {
          // Pull from Monday.com
          const pullResult = await pullSyncFromMonday(
            ctx,
            integration,
            mapping,
            columnMappings,
          );

          if (!pullResult.success) {
            failed++;
            continue;
          }
        }

        if (
          mapping.syncDirection === "push" ||
          mapping.syncDirection === "bidirectional"
        ) {
          // Push to Monday.com
          if (mapping.convexTableName === "orders") {
            // Special handling for orders
            const orders = await ctx.db
              .query("orders")
              .filter((q) =>
                q.or(
                  q.eq(q.field("mondaySyncStatus"), undefined),
                  q.eq(q.field("mondaySyncStatus"), "pending"),
                  q.and(
                    q.gt(q.field("updatedAt"), mapping.lastSyncTimestamp || 0),
                    q.or(
                      q.eq(q.field("mondaySyncStatus"), "synced"),
                      q.eq(q.field("mondaySyncStatus"), "partial"),
                    ),
                  ),
                ),
              )
              .take(20);

            let ordersFailed = 0;

            for (const order of orders) {
              try {
                const orderResult = await syncOrderToMonday(
                  ctx,
                  integration,
                  mapping,
                  columnMappings,
                  order._id,
                );

                if (!orderResult.success) {
                  ordersFailed++;
                }
              } catch (error) {
                ordersFailed++;
                console.error(`Error syncing order ${order._id}:`, error);
              }
            }

            if (ordersFailed > 0) {
              failed++;
              continue;
            }
          } else {
            // Standard push
            const pushResult = await pushSyncToMonday(
              ctx,
              integration,
              mapping,
              columnMappings,
            );

            if (!pushResult.success) {
              failed++;
              continue;
            }
          }
        }

        // Update last sync timestamp and status
        await ctx.db.patch(mapping._id, {
          lastSyncTimestamp: Date.now(),
          syncStatus: "synced",
        });

        succeeded++;
      } catch (error) {
        console.error(`Error syncing mapping ${mapping._id}:`, error);

        // Update sync status on error
        await ctx.db.patch(mapping._id, {
          syncStatus: "error",
        });

        failed++;
      }
    }

    // Update integration last sync timestamp
    await ctx.db.patch(args.integrationId, {
      lastSyncTimestamp: Date.now(),
    });

    return {
      success: failed === 0,
      message: `Synchronized ${succeeded} of ${boardMappings.length} mappings`,
      succeeded,
      failed,
    };
  },
});

/**
 * Update or create a Monday.com integration configuration
 */
export const saveIntegration = mutation({
  args: {
    id: v.optional(v.id("mondayIntegration")),
    apiKey: v.string(),
    workspaceId: v.string(),
    workspaceName: v.string(),
    isEnabled: v.boolean(),
    lastSyncTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.id) {
      await ctx.db.patch(args.id, {
        apiKey: args.apiKey,
        workspaceId: args.workspaceId,
        workspaceName: args.workspaceName,
        isEnabled: args.isEnabled,
        lastSyncTimestamp: args.lastSyncTimestamp,
      });
      return args.id;
    } else {
      return await ctx.db.insert("mondayIntegration", {
        apiKey: args.apiKey,
        workspaceId: args.workspaceId,
        workspaceName: args.workspaceName,
        isEnabled: args.isEnabled,
        lastSyncTimestamp: args.lastSyncTimestamp,
      });
    }
  },
});

/**
 * Create a sync log entry
 */
export const createSyncLog = mutation({
  args: {
    operation: v.string(),
    status: v.string(),
    boardMappingId: v.optional(v.id("mondayBoardMappings")),
    mondayBoardId: v.optional(v.string()),
    convexTable: v.optional(v.string()),
    details: v.optional(v.string()),
    initiatedBy: v.optional(v.string()),
  },
  returns: v.id("mondaySyncLogs"),
  handler: async (ctx, args) => {
    return await createSyncLogHelper(ctx, args.operation, args.status, {
      boardMappingId: args.boardMappingId,
      mondayBoardId: args.mondayBoardId,
      convexTable: args.convexTable,
      details: args.details,
      initiatedBy: args.initiatedBy,
    });
  },
});

/**
 * Log a record-level change in a sync operation
 */
export const logRecordChange = mutation({
  args: {
    syncLogId: v.id("mondaySyncLogs"),
    recordId: v.string(),
    sourceId: v.optional(v.string()),
    operation: v.union(
      v.literal("create"),
      v.literal("update"),
      v.literal("delete"),
      v.literal("error"),
    ),
    table: v.string(),
    details: v.optional(v.string()),
    changes: v.optional(v.any()),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await logRecordChangeHelper(ctx, args.syncLogId, {
      recordId: args.recordId,
      sourceId: args.sourceId,
      operation: args.operation,
      table: args.table,
      details: args.details,
      changes: args.changes,
      error: args.error,
    });
    return null;
  },
});

/**
 * Log an error with context information
 */
export const logError = mutation({
  args: {
    syncLogId: v.id("mondaySyncLogs"),
    error: v.string(),
    operation: v.optional(v.string()),
    boardMappingId: v.optional(v.id("mondayBoardMappings")),
    recordId: v.optional(v.string()),
    additionalDetails: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await logErrorHelper(ctx, args.syncLogId, args.error, {
      operation: args.operation,
      boardMappingId: args.boardMappingId,
      recordId: args.recordId,
      additionalDetails: args.additionalDetails,
    });
    return null;
  },
});

/**
 * Log a performance metric
 */
export const logPerformanceMetric = mutation({
  args: {
    syncLogId: v.id("mondaySyncLogs"),
    name: v.string(),
    value: v.number(),
    unit: v.optional(v.string()),
    details: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await logPerformanceMetricHelper(ctx, args.syncLogId, {
      name: args.name,
      value: args.value,
      unit: args.unit,
      details: args.details,
    });
    return null;
  },
});

/**
 * Log a message
 */
export const logMessage = mutation({
  args: {
    syncLogId: v.id("mondaySyncLogs"),
    level: v.union(
      v.literal("debug"),
      v.literal("info"),
      v.literal("warning"),
      v.literal("error"),
      v.literal("critical"),
    ),
    message: v.string(),
    details: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await logMessageHelper(
      ctx,
      args.syncLogId,
      args.level,
      args.message,
      args.details,
    );
    return null;
  },
});

/**
 * Log the start of a sync phase
 */
export const logSyncPhase = mutation({
  args: {
    syncLogId: v.id("mondaySyncLogs"),
    phase: v.string(),
    details: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await logSyncPhaseHelper(ctx, args.syncLogId, args.phase, args.details);
    return null;
  },
});

/**
 * End a sync phase
 */
export const endSyncPhase = mutation({
  args: {
    syncLogId: v.id("mondaySyncLogs"),
    success: v.optional(v.boolean()),
    details: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await endSyncPhaseHelper(ctx, args.syncLogId, {
      success: args.success ?? true,
      details: args.details,
    });
    return null;
  },
});

/**
 * Calculate and update sync metrics
 */
export const calculateSyncMetrics = mutation({
  args: {
    syncLogId: v.id("mondaySyncLogs"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await calculateSyncMetricsHelper(ctx, args.syncLogId);
    return null;
  },
});

/**
 * Create a new sync rule
 */
export const createSyncRule = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    integrationId: v.id("mondayIntegration"),
    boardMappingId: v.id("mondayBoardMappings"),
    triggerType: v.union(
      v.literal("onCreate"),
      v.literal("onUpdate"),
      v.literal("onStatusChange"),
      v.literal("onFieldValue"),
      v.literal("onCheckout"),
      v.literal("onSchedule"),
      v.literal("onManualTrigger"),
    ),
    triggerTable: v.string(),
    triggerField: v.optional(v.string()),
    triggerValue: v.optional(v.string()),
    triggerCondition: v.optional(v.string()), // JSON string with complex condition
    actionType: v.union(
      v.literal("push"),
      v.literal("pull"),
      v.literal("updateField"),
      v.literal("createItem"),
      v.literal("updateItem"),
      v.literal("createRelated"),
    ),
    actionConfig: v.string(), // JSON string with action configuration
    priority: v.number(),
    cooldownMs: v.optional(v.number()),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate the integration exists
    const integration = await ctx.db.get(args.integrationId);
    if (!integration) {
      throw new Error(`Integration not found: ${args.integrationId}`);
    }

    // Validate the board mapping exists
    const boardMapping = await ctx.db.get(args.boardMappingId);
    if (!boardMapping) {
      throw new Error(`Board mapping not found: ${args.boardMappingId}`);
    }

    // Validate JSON strings
    if (args.triggerCondition) {
      try {
        JSON.parse(args.triggerCondition);
      } catch (e) {
        throw new Error(
          `Invalid trigger condition JSON: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    try {
      JSON.parse(args.actionConfig);
    } catch (e) {
      throw new Error(
        `Invalid action config JSON: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    // Create the rule
    const ruleId = await ctx.db.insert("mondaySyncRules", {
      name: args.name,
      description: args.description,
      isEnabled: true,
      integrationId: args.integrationId,
      boardMappingId: args.boardMappingId,
      triggerType: args.triggerType,
      triggerTable: args.triggerTable,
      triggerField: args.triggerField,
      triggerValue: args.triggerValue,
      triggerCondition: args.triggerCondition,
      actionType: args.actionType,
      actionConfig: args.actionConfig,
      priority: args.priority,
      cooldownMs: args.cooldownMs,
      executionCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: args.createdBy,
    });

    return { success: true, ruleId };
  },
});

/**
 * Update an existing sync rule
 */
export const updateSyncRule = mutation({
  args: {
    ruleId: v.id("mondaySyncRules"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isEnabled: v.optional(v.boolean()),
    integrationId: v.optional(v.id("mondayIntegration")),
    boardMappingId: v.optional(v.id("mondayBoardMappings")),
    triggerType: v.optional(
      v.union(
        v.literal("onCreate"),
        v.literal("onUpdate"),
        v.literal("onStatusChange"),
        v.literal("onFieldValue"),
        v.literal("onCheckout"),
        v.literal("onSchedule"),
        v.literal("onManualTrigger"),
      ),
    ),
    triggerTable: v.optional(v.string()),
    triggerField: v.optional(v.string()),
    triggerValue: v.optional(v.string()),
    triggerCondition: v.optional(v.string()), // JSON string with complex condition
    actionType: v.optional(
      v.union(
        v.literal("push"),
        v.literal("pull"),
        v.literal("updateField"),
        v.literal("createItem"),
        v.literal("updateItem"),
        v.literal("createRelated"),
      ),
    ),
    actionConfig: v.optional(v.string()), // JSON string with action configuration
    priority: v.optional(v.number()),
    cooldownMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Validate the rule exists
    const rule = await ctx.db.get(args.ruleId);
    if (!rule) {
      throw new Error(`Rule not found: ${args.ruleId}`);
    }

    // Validate the integration if changed
    if (args.integrationId) {
      const integration = await ctx.db.get(args.integrationId);
      if (!integration) {
        throw new Error(`Integration not found: ${args.integrationId}`);
      }
    }

    // Validate the board mapping if changed
    if (args.boardMappingId) {
      const boardMapping = await ctx.db.get(args.boardMappingId);
      if (!boardMapping) {
        throw new Error(`Board mapping not found: ${args.boardMappingId}`);
      }
    }

    // Validate JSON strings
    if (args.triggerCondition) {
      try {
        JSON.parse(args.triggerCondition);
      } catch (e) {
        throw new Error(
          `Invalid trigger condition JSON: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    if (args.actionConfig) {
      try {
        JSON.parse(args.actionConfig);
      } catch (e) {
        throw new Error(
          `Invalid action config JSON: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    // Update the rule
    const patchFields: Partial<typeof rule> = {
      updatedAt: Date.now(),
    };

    // Add all optional fields to the patch if they're provided
    for (const [key, value] of Object.entries(args)) {
      if (key !== "ruleId" && value !== undefined) {
        patchFields[key as keyof typeof rule] = value as any;
      }
    }

    await ctx.db.patch(args.ruleId, patchFields);

    return { success: true, ruleId: args.ruleId };
  },
});

/**
 * Delete a sync rule
 */
export const deleteSyncRule = mutation({
  args: {
    ruleId: v.id("mondaySyncRules"),
  },
  handler: async (ctx, args) => {
    // Validate the rule exists
    const rule = await ctx.db.get(args.ruleId);
    if (!rule) {
      throw new Error(`Rule not found: ${args.ruleId}`);
    }

    // Delete the rule
    await ctx.db.delete(args.ruleId);

    return { success: true };
  },
});

/**
 * Toggle a sync rule enabled state
 */
export const toggleSyncRule = mutation({
  args: {
    ruleId: v.id("mondaySyncRules"),
    isEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Validate the rule exists
    const rule = await ctx.db.get(args.ruleId);
    if (!rule) {
      throw new Error(`Rule not found: ${args.ruleId}`);
    }

    // Update the rule
    await ctx.db.patch(args.ruleId, {
      isEnabled: args.isEnabled,
      updatedAt: Date.now(),
    });

    return { success: true, ruleId: args.ruleId };
  },
});

/**
 * Manually trigger a sync rule
 */
export const triggerSyncRule = mutation({
  args: {
    ruleId: v.id("mondaySyncRules"),
    documentId: v.string(),
  },
  handler: async (ctx, args) => {
    // Import the rules engine functions
    const { manuallyTriggerRule } = await import("./lib/rules");

    // Manually trigger the rule
    const result = await manuallyTriggerRule(ctx, args.ruleId, args.documentId);

    return {
      success: result.status === "success",
      details: result.details,
      error: result.error,
      timeTaken: result.timeTaken,
    };
  },
});

export const testSyncRule = mutation({
  args: {
    integrationId: v.id("mondayIntegration"),
    ruleId: v.optional(v.id("mondaySyncRules")),
    documentId: v.string(),
    draftRule: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Get the integration
    const integration = await ctx.db.get(args.integrationId);
    if (!integration) {
      throw new Error("Integration not found");
    }

    // Get rule to test (either existing or draft)
    let rule: any;

    if (args.ruleId) {
      // Get existing rule
      rule = await ctx.db.get(args.ruleId);
      if (!rule) {
        throw new Error("Rule not found");
      }
    } else if (args.draftRule) {
      // Use draft rule data
      rule = args.draftRule;
    } else {
      throw new Error("Either ruleId or draftRule must be provided");
    }

    // Get the document to test with
    // In a real implementation, you would validate the document ID and retrieve the actual document
    // For this simplified version, we'll just use the ID as provided

    try {
      // Simulate testing the rule - evaluate the trigger conditions
      const triggerResult = await evaluateRuleTrigger(rule, args.documentId);

      if (!triggerResult.triggered) {
        return {
          success: false,
          message: "Rule trigger conditions not met",
          details: {
            rule: sanitizeRule(rule),
            triggerResult,
            documentId: args.documentId,
          },
        };
      }

      // Simulate executing the rule action
      const actionResult = await simulateRuleAction(rule, args.documentId);

      return {
        success: true,
        message:
          "Rule trigger conditions met and action would execute successfully",
        details: {
          rule: sanitizeRule(rule),
          triggerResult,
          actionResult,
          documentId: args.documentId,
        },
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
        details: {
          rule: sanitizeRule(rule),
          documentId: args.documentId,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  },
});

// Helper function to evaluate rule trigger conditions (simulation)
async function evaluateRuleTrigger(rule: any, documentId: string) {
  // This is a simplified simulation - in a real implementation,
  // you would check the actual document against the rule trigger conditions

  const triggerType = rule.triggerType;

  // Simulate different trigger types
  if (triggerType === "onCreate") {
    // Always triggered for onCreate when testing
    return {
      triggered: true,
      reason: "Document would trigger onCreate rule",
    };
  } else if (triggerType === "onUpdate") {
    // Check if the rule specifies a field to monitor
    if (!rule.triggerField) {
      return {
        triggered: false,
        reason: "Rule requires a trigger field but none specified",
      };
    }

    return {
      triggered: true,
      reason: `Document update would trigger onUpdate rule for field "${rule.triggerField}"`,
    };
  } else if (triggerType === "onStatusChange") {
    if (!rule.triggerField) {
      return {
        triggered: false,
        reason: "Rule requires a status field but none specified",
      };
    }

    return {
      triggered: true,
      reason: `Status change would trigger rule for field "${rule.triggerField}"`,
    };
  } else if (triggerType === "onFieldValue") {
    if (!rule.triggerField || !rule.triggerValue) {
      return {
        triggered: false,
        reason:
          "Rule requires both a trigger field and value but one or both are missing",
      };
    }

    // For testing purposes, assume the document has the specified value
    return {
      triggered: true,
      reason: `Document has field "${rule.triggerField}" with value "${rule.triggerValue}"`,
    };
  } else if (triggerType === "onManualTrigger") {
    // Always triggered for manual triggers
    return {
      triggered: true,
      reason: "Rule would be triggered manually",
    };
  } else if (triggerType === "onSchedule") {
    // Schedule triggers are always triggered during testing
    return {
      triggered: true,
      reason: "Rule would be triggered on schedule",
    };
  } else {
    return {
      triggered: false,
      reason: `Unknown or unsupported trigger type: ${triggerType}`,
    };
  }
}

// Helper function to simulate rule action execution
async function simulateRuleAction(rule: any, documentId: string) {
  // This is a simplified simulation - in a real implementation,
  // you would simulate the actual action logic

  const actionType = rule.actionType;
  let actionConfig: any = {};

  try {
    actionConfig =
      typeof rule.actionConfig === "string"
        ? JSON.parse(rule.actionConfig)
        : rule.actionConfig;
  } catch (e) {
    throw new Error("Invalid action configuration: " + e);
  }

  // Simulate different action types
  if (actionType === "push") {
    if (!actionConfig.boardMappingId) {
      throw new Error("Push action requires a boardMappingId");
    }

    return {
      actionType: "push",
      success: true,
      details: {
        message: "Document would be pushed to Monday.com",
        boardMappingId: actionConfig.boardMappingId,
      },
    };
  } else if (actionType === "pull") {
    if (!actionConfig.boardMappingId) {
      throw new Error("Pull action requires a boardMappingId");
    }

    return {
      actionType: "pull",
      success: true,
      details: {
        message: "Data would be pulled from Monday.com",
        boardMappingId: actionConfig.boardMappingId,
      },
    };
  } else if (actionType === "updateField") {
    if (!actionConfig.table || !actionConfig.field) {
      throw new Error("updateField action requires table and field properties");
    }

    return {
      actionType: "updateField",
      success: true,
      details: {
        message: `Field "${actionConfig.field}" in table "${actionConfig.table}" would be updated`,
        table: actionConfig.table,
        field: actionConfig.field,
        value: actionConfig.value,
      },
    };
  } else if (actionType === "createItem") {
    if (!actionConfig.targetBoardId || !actionConfig.itemTemplate) {
      throw new Error(
        "createItem action requires targetBoardId and itemTemplate",
      );
    }

    return {
      actionType: "createItem",
      success: true,
      details: {
        message: "New item would be created in Monday.com",
        targetBoardId: actionConfig.targetBoardId,
        itemTemplate: actionConfig.itemTemplate,
      },
    };
  } else if (actionType === "updateItem") {
    if (!actionConfig.targetBoardId) {
      throw new Error("updateItem action requires targetBoardId");
    }

    return {
      actionType: "updateItem",
      success: true,
      details: {
        message: "Item would be updated in Monday.com",
        targetBoardId: actionConfig.targetBoardId,
      },
    };
  } else {
    throw new Error(`Unknown or unsupported action type: ${actionType}`);
  }
}

// Helper function to sanitize rule data for display
function sanitizeRule(rule: any) {
  // Create a copy without sensitive data
  const sanitized = { ...rule };

  // Remove any sensitive fields
  delete sanitized.apiToken;
  delete sanitized.secretKey;

  return sanitized;
}

/**
 * Resolve a sync conflict using the specified strategy
 */
export const resolveSyncConflict = mutation({
  args: {
    conflictId: v.id("mondaySyncConflicts"),
    strategy: v.union(
      v.literal("latest_wins"),
      v.literal("monday_wins"),
      v.literal("convex_wins"),
      v.literal("manual"),
    ),
    manualResolution: v.optional(v.string()), // JSON string of manually resolved values
    applyChanges: v.optional(v.boolean()), // Whether to apply changes immediately
    resolvedBy: v.optional(v.string()), // User identifier or "system"
  },
  handler: async (ctx, args) => {
    // Get the conflict record
    const conflict = await ctx.db.get(args.conflictId);
    if (!conflict) {
      throw new Error(`Conflict ${args.conflictId} not found`);
    }

    // Skip if already resolved
    if (
      conflict.status === "resolved_auto" ||
      conflict.status === "resolved_manual"
    ) {
      return {
        success: true,
        alreadyResolved: true,
        message: "Conflict was already resolved",
      };
    }

    // Create a sync log entry for this operation
    const syncLogId = await ctx.db.insert("mondaySyncLogs", {
      operation: "conflict_resolution",
      status: "in-progress",
      startTimestamp: Date.now(),
      endTimestamp: Date.now(),
      boardMappingId: conflict.boardMappingId,
      convexTable: conflict.convexTable,
      initiatedBy: args.resolvedBy || "system",
      details: `Resolving conflict ${args.conflictId} using ${args.strategy} strategy`,
    });

    try {
      // Parse stored values
      const mondayValues = JSON.parse(conflict.mondayValues);
      const convexValues = JSON.parse(conflict.convexValues);

      // Apply resolution strategy
      let resolvedValues: Record<string, unknown> = {};
      const resolutionStatus =
        args.strategy === "manual" ? "resolved_manual" : "resolved_auto";

      switch (args.strategy) {
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
          if (!args.manualResolution) {
            throw new Error(
              "Manual resolution strategy requires manualResolution",
            );
          }
          try {
            resolvedValues = JSON.parse(args.manualResolution);
          } catch (error) {
            throw new Error("Invalid manual resolution format");
          }
          break;

        default:
          throw new Error(
            `Unknown resolution strategy: ${String(args.strategy)}`,
          );
      }

      const now = Date.now();

      // Update the conflict record
      await ctx.db.patch(args.conflictId, {
        resolvedAt: now,
        status: resolutionStatus,
        resolutionStrategy: args.strategy,
        resolvedBy: args.resolvedBy ?? "system",
        resolvedValues: JSON.stringify(resolvedValues),
        syncLogId,
      });

      // Update the sync log with success
      await ctx.db.patch(syncLogId, {
        status: "completed",
        endTimestamp: now,
        timeTaken: now - ctx.db.get(syncLogId)!.startTimestamp,
      });

      // Apply changes if requested
      if (args.applyChanges) {
        // Get the board mapping and item mapping
        const boardMapping = await ctx.db.get(conflict.boardMappingId);
        const itemMapping = await ctx.db.get(conflict.itemMappingId);

        if (!boardMapping || !itemMapping) {
          throw new Error("Required mapping information not found");
        }

        // TODO: Apply changes to both systems - will be implemented in follow-up
        // This would call functions in the sync.ts module to push/pull data
      }

      return {
        success: true,
        message: `Conflict resolved using ${args.strategy} strategy`,
        resolvedValues,
      };
    } catch (error) {
      // Update the sync log with error
      await ctx.db.patch(syncLogId, {
        status: "failed",
        endTimestamp: Date.now(),
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  },
});

/**
 * Batch resolve sync conflicts for a board mapping
 */
export const resolveSyncConflictsBatch = mutation({
  args: {
    boardMappingId: v.id("mondayBoardMappings"),
    strategy: v.union(
      v.literal("latest_wins"),
      v.literal("monday_wins"),
      v.literal("convex_wins"),
    ),
    applyChanges: v.optional(v.boolean()),
    resolvedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get all unresolved conflicts for this board mapping
    const conflicts = await ctx.db
      .query("mondaySyncConflicts")
      .withIndex("by_board_mapping", (q) =>
        q.eq("boardMappingId", args.boardMappingId),
      )
      .filter((q) => q.eq(q.field("status"), "detected"))
      .collect();

    if (conflicts.length === 0) {
      return {
        success: true,
        processed: 0,
        message: "No unresolved conflicts found",
      };
    }

    // Create a sync log entry for this batch operation
    const syncLogId = await ctx.db.insert("mondaySyncLogs", {
      operation: "conflict_resolution_batch",
      status: "in-progress",
      startTimestamp: Date.now(),
      endTimestamp: Date.now(),
      boardMappingId: args.boardMappingId,
      initiatedBy: args.resolvedBy || "system",
      details: `Batch resolving ${conflicts.length} conflicts using ${args.strategy} strategy`,
      recordsProcessed: conflicts.length,
    });

    let resolved = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process each conflict
    for (const conflict of conflicts) {
      try {
        // Resolve the conflict using the specified strategy
        await ctx.runMutation(internal.monday.resolveConflictInternal, {
          conflictId: conflict._id,
          strategy: args.strategy,
          syncLogId,
          resolvedBy: args.resolvedBy,
        });

        resolved++;
      } catch (error) {
        failed++;
        errors.push(
          `Error resolving conflict ${conflict._id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    // Update the sync log with results
    await ctx.db.patch(syncLogId, {
      status: failed > 0 ? "completed_with_errors" : "completed",
      endTimestamp: Date.now(),
      recordsProcessed: conflicts.length,
      recordsCreated: 0,
      recordsUpdated: resolved,
      recordsFailed: failed,
      errorDetails: errors.length > 0 ? errors.join("; ") : undefined,
    });

    // Apply changes if requested
    if (args.applyChanges && resolved > 0) {
      // TODO: Implement sync to apply resolved conflicts
    }

    return {
      success: true,
      processed: conflicts.length,
      resolved,
      failed,
      message:
        failed > 0
          ? `Resolved ${resolved} of ${conflicts.length} conflicts with ${failed} errors`
          : `Successfully resolved ${resolved} conflicts`,
    };
  },
});

/**
 * Internal function to resolve a conflict
 * (Used by the batch resolution process)
 */
export const resolveConflictInternal = internalMutation({
  args: {
    conflictId: v.id("mondaySyncConflicts"),
    strategy: v.union(
      v.literal("latest_wins"),
      v.literal("monday_wins"),
      v.literal("convex_wins"),
    ),
    syncLogId: v.id("mondaySyncLogs"),
    resolvedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the conflict record
    const conflict = await ctx.db.get(args.conflictId);
    if (!conflict) {
      throw new Error(`Conflict ${args.conflictId} not found`);
    }

    // Skip if already resolved
    if (
      conflict.status === "resolved_auto" ||
      conflict.status === "resolved_manual"
    ) {
      return;
    }

    // Parse stored values
    const mondayValues = JSON.parse(conflict.mondayValues);
    const convexValues = JSON.parse(conflict.convexValues);

    // Apply resolution strategy
    let resolvedValues: Record<string, unknown> = {};

    switch (args.strategy) {
      case "latest_wins":
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
        resolvedValues = { ...mondayValues };
        break;

      case "convex_wins":
        resolvedValues = { ...convexValues };
        break;

      default:
        throw new Error(
          `Unknown resolution strategy: ${String(args.strategy)}`,
        );
    }

    // Update the conflict record
    await ctx.db.patch(args.conflictId, {
      resolvedAt: Date.now(),
      status: "resolved_auto",
      resolutionStrategy: args.strategy,
      resolvedBy: args.resolvedBy ?? "system",
      resolvedValues: JSON.stringify(resolvedValues),
      syncLogId: args.syncLogId,
    });
  },
});

/**
 * Perform an optimized pull sync from Monday.com to Convex
 * Designed for large datasets with batching and pagination
 */
export const runOptimizedPullSync = mutation({
  args: {
    integrationId: v.id("mondayIntegration"),
    boardMappingId: v.id("mondayBoardMappings"),
    forceFullSync: v.optional(v.boolean()),
    batchSize: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const result = await performOptimizedPullSync(
      ctx,
      args.integrationId,
      args.boardMappingId,
      {
        forceFullSync: args.forceFullSync,
        batchSize: args.batchSize,
        pageSize: args.pageSize,
      },
    );

    return result;
  },
});

/**
 * Perform an optimized push sync from Convex to Monday.com
 * Designed for large datasets with batching
 */
export const runOptimizedPushSync = mutation({
  args: {
    integrationId: v.id("mondayIntegration"),
    boardMappingId: v.id("mondayBoardMappings"),
    forceFullSync: v.optional(v.boolean()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const result = await performOptimizedPushSync(
      ctx,
      args.integrationId,
      args.boardMappingId,
      {
        forceFullSync: args.forceFullSync,
        batchSize: args.batchSize,
      },
    );

    return result;
  },
});

/**
 * Update performance settings for a Monday.com integration
 */
export const updateIntegrationPerformanceSettings = mutation({
  args: {
    integrationId: v.id("mondayIntegration"),
    preferredPageSize: v.optional(v.number()),
    maxConcurrentRequests: v.optional(v.number()),
    rateLimitThreshold: v.optional(v.number()),
    batchSizeOverride: v.optional(v.number()),
    optimizationStrategy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { integrationId, ...settings } = args;

    // Get current integration
    const integration = await ctx.db.get(integrationId);
    if (!integration) {
      throw new Error(`Integration with ID ${integrationId} not found`);
    }

    // Update with new performance settings
    await ctx.db.patch(integrationId, settings);

    return {
      success: true,
      message: "Performance settings updated successfully",
    };
  },
});
