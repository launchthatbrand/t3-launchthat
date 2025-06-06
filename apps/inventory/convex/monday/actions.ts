/**
 * Monday.com Integration Actions
 *
 * This module contains action functions for interacting with Monday.com API.
 */

import { Doc, Id } from "../_generated/dataModel";
import {
  MondayBoardMapping,
  MondayIntegration,
  MondayWorkspace,
} from "./lib/types";
import { action, internalAction } from "../_generated/server";
import { api, internal } from "../_generated/api";
import {
  getBoardColumns,
  getBoardItemCount,
  getBoards,
  getWorkspaces,
  testApiConnection,
} from "./lib/api";

import { v } from "convex/values";

/**
 * Test a Monday.com API connection
 */
export const testConnection = action({
  args: {
    apiKey: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    workspaces: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
        }),
      ),
    ),
  }),
  handler: async (ctx, args) => {
    return await testApiConnection(args.apiKey);
  },
});

/**
 * Update integration connection info after testing
 */
export const testAndUpdateConnection = internalAction({
  args: {
    integrationId: v.id("mondayIntegration"),
    apiKey: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    try {
      // Test the connection
      const connectionResult = await testApiConnection(args.apiKey);

      // Get the first workspace if successful
      let workspace: MondayWorkspace | null = null;
      if (
        connectionResult.success &&
        connectionResult.workspaces &&
        connectionResult.workspaces.length > 0
      ) {
        workspace = connectionResult.workspaces[0];
      }

      // Update the integration with the result
      await ctx.runMutation(internal.monday.internal.updateConnection, {
        id: args.integrationId,
        connectionStatus: connectionResult.success ? "connected" : "error",
        lastError: connectionResult.success
          ? undefined
          : connectionResult.message,
        workspaceId: workspace ? workspace.id : "",
        workspaceName: workspace ? workspace.name : "",
      });

      return connectionResult.success;
    } catch (error) {
      console.error("Error testing connection:", error);

      // Update with error
      await ctx.runMutation(internal.monday.internal.updateConnection, {
        id: args.integrationId,
        connectionStatus: "error",
        lastError: error instanceof Error ? error.message : "Unknown error",
      });

      return false;
    }
  },
});

/**
 * Get workspace information from Monday.com
 */
export const getWorkspacesInfo = action({
  args: {
    apiKey: v.string(),
  },
  returns: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    try {
      const workspaces = await getWorkspaces(args.apiKey);
      return workspaces.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
      }));
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      return [];
    }
  },
});

/**
 * Get boards from a workspace
 */
export const getBoardsFromWorkspace = action({
  args: {
    apiKey: v.string(),
    workspaceId: v.string(),
  },
  returns: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      description: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    try {
      const boards = await getBoards(args.apiKey, args.workspaceId);
      return boards.map((board) => ({
        id: board.id,
        name: board.name,
        description: board.description ?? "",
      }));
    } catch (error) {
      console.error("Error fetching boards:", error);
      return [];
    }
  },
});

/**
 * Get columns from a board
 */
export const getColumnsFromBoard = action({
  args: {
    apiKey: v.string(),
    boardId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    columns: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          type: v.string(),
          settings_str: v.optional(v.string()),
        }),
      ),
    ),
    message: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const columns = await getBoardColumns(args.apiKey, args.boardId);
      return {
        success: true,
        columns: columns.map((column) => ({
          id: column.id,
          title: column.title,
          type: column.type,
          settings_str: column.settings_str,
        })),
      };
    } catch (error) {
      console.error("Error fetching columns:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Get items count from a board
 */
export const getBoardItemCountAction = action({
  args: {
    apiKey: v.string(),
    boardId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    count: v.number(),
    message: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    return await getBoardItemCount(args.apiKey, args.boardId);
  },
});

/**
 * Synchronize all active board mappings
 */
export const syncAll = internalAction({
  args: {
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
      const direction = args.direction || "both";

      if (direction === "pull" || direction === "both") {
        // Pull data from Monday.com to Convex
        await ctx.runMutation(api.monday.mutations.syncAllBoards, {});
      }

      if (direction === "push" || direction === "both") {
        // Push data from Convex to Monday.com
        await ctx.runMutation(api.monday.mutations.syncAllOrders, {
          limit: 50,
        });
      }

      return {
        success: true,
        message: `Sync completed for direction: ${direction}`,
      };
    } catch (error) {
      console.error("Error in sync all action:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Sync orders from Convex to Monday.com
 */
export const syncOrders = internalAction({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Start the order sync mutation
      const result = await ctx.runMutation(api.monday.mutations.syncAllOrders, {
        limit: args.limit || 50,
      });

      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      console.error("Error in sync orders action:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Update integration connection status
 */
export const updateConnection = internalAction({
  args: {
    id: v.id("mondayIntegration"),
    connectionStatus: v.string(),
    lastError: v.optional(v.string()),
    workspaceId: v.optional(v.string()),
    workspaceName: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    try {
      const updateFields: Record<string, unknown> = {
        connectionStatus: args.connectionStatus,
        lastConnectionCheck: Date.now(),
      };

      if (args.lastError !== undefined) {
        updateFields.lastError = args.lastError;
      }

      if (args.workspaceId !== undefined) {
        updateFields.workspaceId = args.workspaceId;
      }

      if (args.workspaceName !== undefined) {
        updateFields.workspaceName = args.workspaceName;
      }

      await ctx.runMutation(internal.monday.internal.updateConnection, {
        id: args.id,
        connectionStatus: args.connectionStatus,
        ...updateFields,
      });

      return true;
    } catch (error) {
      console.error("Error updating connection:", error);
      return false;
    }
  },
});

/**
 * Connect to Monday.com and test API key validity
 */
export const connect = action({
  args: {
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await testApiConnection(args.apiKey);

    if (result.success) {
      // If connection is successful, create or update integration
      const workspaces = result.workspaces || [];

      if (workspaces.length === 0) {
        return {
          success: false,
          message: "No workspaces found in the Monday.com account",
        };
      }

      const firstWorkspace = workspaces[0];

      // Create or update integration
      const id = await ctx.runMutation(
        internal.monday.internal.updateConnection,
        {
          apiKey: args.apiKey,
          workspaceId: firstWorkspace.id,
          workspaceName: firstWorkspace.name,
        },
      );

      return {
        success: true,
        message: "Connection successful",
        id,
        workspace: {
          id: firstWorkspace.id,
          name: firstWorkspace.name,
        },
      };
    }

    return result;
  },
});

/**
 * Fetch boards from Monday.com
 */
export const fetchBoards = internalAction({
  args: {
    integrationId: v.id("mondayIntegration"),
  },
  handler: async (ctx, args) => {
    const integration = await ctx.runQuery(
      internal.monday.internal.getIntegration,
      { id: args.integrationId },
    );

    if (!integration) {
      return {
        success: false,
        message: "Integration not found",
        boards: [],
      };
    }

    try {
      const boards = await getBoards(
        integration.apiKey,
        integration.workspaceId,
      );

      return {
        success: true,
        message: `Found ${boards.length} boards`,
        boards: boards.map((board) => ({
          id: board.id,
          name: board.name,
          description: board.description || "",
        })),
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        boards: [],
      };
    }
  },
});

/**
 * Fetch columns from a Monday.com board
 */
export const fetchBoardColumns = internalAction({
  args: {
    integrationId: v.id("mondayIntegration"),
    boardId: v.string(),
  },
  handler: async (ctx, args) => {
    const integration = await ctx.runQuery(
      internal.monday.internal.getIntegration,
      { id: args.integrationId },
    );

    if (!integration) {
      return {
        success: false,
        message: "Integration not found",
        columns: [],
      };
    }

    try {
      const columns = await getBoardColumns(integration.apiKey, args.boardId);

      return {
        success: true,
        message: `Found ${columns.length} columns`,
        columns: columns.map((column) => ({
          id: column.id,
          title: column.title,
          type: column.type,
          settings: column.settings_str ? JSON.parse(column.settings_str) : {},
        })),
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        columns: [],
      };
    }
  },
});

/**
 * Perform a manual pull sync from Monday.com for a specific board mapping
 */
export const manualPullSync = internalAction({
  args: {
    boardMappingId: v.id("mondayBoardMappings"),
  },
  handler: async (ctx, args) => {
    try {
      // Get the board mapping details
      const boardMapping = await ctx.runQuery(
        internal.monday.internal.getBoardMapping,
        { id: args.boardMappingId },
      );

      if (!boardMapping) {
        return {
          success: false,
          message: "Board mapping not found",
        };
      }

      // Get the integration details
      const integration = await ctx.runQuery(
        internal.monday.internal.getIntegration,
        { id: boardMapping.integrationId },
      );

      if (!integration) {
        return {
          success: false,
          message: "Integration not found",
        };
      }

      // Start the sync process
      const syncLogId = await ctx.runMutation(
        internal.monday.internal.startSync,
        {
          boardMappingId: args.boardMappingId,
          operation: "manual_pull",
        },
      );

      // Get the column mappings
      const columnMappings = await ctx.runQuery(
        internal.monday.internal.getColumnMappings,
        { boardMappingId: args.boardMappingId },
      );

      if (columnMappings.length === 0) {
        await ctx.runMutation(internal.monday.internal.completeSyncWithError, {
          syncLogId,
          error: "No column mappings defined for this board",
        });

        return {
          success: false,
          message: "No column mappings defined for this board",
        };
      }

      // Perform the sync operation
      const syncResult = await ctx.runMutation(
        internal.monday.internal.executePullSync,
        {
          integrationId: integration._id,
          boardMappingId: args.boardMappingId,
          syncLogId,
        },
      );

      return {
        success: syncResult.success,
        message: syncResult.message,
        recordsProcessed: syncResult.recordsProcessed,
        recordsCreated: syncResult.recordsCreated,
        recordsUpdated: syncResult.recordsUpdated,
        recordsFailed: syncResult.recordsFailed,
      };
    } catch (error) {
      console.error("Error in manualPullSync:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Get the sync status for a specific board mapping
 */
export const getSyncStatus = internalAction({
  args: {
    boardMappingId: v.id("mondayBoardMappings"),
  },
  handler: async (ctx, args) => {
    try {
      // Get the board mapping details
      const boardMapping = await ctx.runQuery(
        internal.monday.internal.getBoardMapping,
        { id: args.boardMappingId },
      );

      if (!boardMapping) {
        return {
          success: false,
          message: "Board mapping not found",
        };
      }

      // Get the latest sync log
      const syncLog = await ctx.runQuery(
        internal.monday.internal.getLatestSyncLog,
        { boardMappingId: args.boardMappingId },
      );

      return {
        success: true,
        syncStatus: boardMapping.syncStatus || "not_synced",
        lastSyncTimestamp: boardMapping.lastSyncTimestamp,
        lastSyncLog: syncLog,
      };
    } catch (error) {
      console.error("Error in getSyncStatus:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
