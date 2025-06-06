/**
 * Monday.com Integration Client API
 *
 * This module provides a bridge between the frontend and the Convex API functions.
 * It maps frontend expectations to the correct backend functions.
 */

import { action, mutation, query } from "../_generated/server";
import { api, internal } from "../_generated/api";

import { v } from "convex/values";

/**
 * Test a Monday.com API connection
 * This is a wrapper around the action that the frontend expects
 */
export const testConnection = action({
  args: {
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    // Call the Monday test connection action directly
    return await ctx.runAction(api.monday.actions.testConnection, args);
  },
});

/**
 * Get integration config
 */
export const getIntegrationConfig = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("mondayIntegration").order("desc").first();
  },
});

/**
 * Create a board mapping
 */
export const createBoardMapping = mutation({
  args: {
    integrationId: v.id("mondayIntegration"),
    mondayBoardId: v.string(),
    mondayBoardName: v.string(),
    convexTableName: v.string(),
    isEnabled: v.boolean(),
    syncDirection: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("mondayBoardMappings", {
      integrationId: args.integrationId,
      mondayBoardId: args.mondayBoardId,
      mondayBoardName: args.mondayBoardName,
      convexTableName: args.convexTableName,
      isEnabled: args.isEnabled,
      syncDirection: args.syncDirection,
      lastSyncTimestamp: Date.now(),
      syncStatus: "pending",
    });
  },
});

/**
 * Get board mappings
 */
export const getBoardMappings = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("mondayBoardMappings").collect();
  },
});

/**
 * Update board mapping
 */
export const updateBoardMapping = mutation({
  args: {
    id: v.id("mondayBoardMappings"),
    syncDirection: v.optional(v.string()),
    isEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return true;
  },
});

/**
 * Sync a board
 */
export const syncBoard = mutation({
  args: {
    boardMappingId: v.id("mondayBoardMappings"),
  },
  handler: async (ctx, args) => {
    const mapping = await ctx.db.get(args.boardMappingId);
    if (!mapping) {
      return { success: false, message: "Board mapping not found" };
    }

    // Start sync process
    await ctx.scheduler.runAfter(0, internal.monday.mutations.startSync, {
      boardMappingId: args.boardMappingId,
    });

    return {
      success: true,
      message: "Synchronization started successfully",
    };
  },
});

/**
 * Get board columns
 */
export const getBoardColumns = action({
  args: {
    apiKey: v.string(),
    boardId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runAction(api.monday.actions.getColumnsFromBoard, args);
  },
});

/**
 * Get board item count
 */
export const getBoardItemCount = action({
  args: {
    apiKey: v.string(),
    boardId: v.string(),
  },
  handler: async (ctx, args) => {
    // This is a placeholder - implement actual counting logic
    return { success: true, count: 0 };
  },
});

/**
 * Get boards
 */
export const getBoards = action({
  args: {
    apiKey: v.string(),
    workspaceId: v.string(),
  },
  returns: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      description: v.string(), // Ensure description is always a string
    }),
  ),
  handler: async (ctx, args) => {
    // Get boards from Monday.com and ensure description is always a string
    const results = await ctx.runAction(
      api.monday.actions.getBoardsFromWorkspace,
      args,
    );

    // Map the results to ensure description is never null
    return results.map((board) => ({
      ...board,
      description: board.description ?? "", // Replace null with empty string
    }));
  },
});

/**
 * Update integration
 */
export const updateIntegration = mutation({
  args: {
    id: v.id("mondayIntegration"),
    apiKey: v.optional(v.string()),
    isEnabled: v.optional(v.boolean()),
    autoSync: v.optional(v.boolean()),
    processSubitems: v.optional(v.boolean()),
    autoSyncIntervalMinutes: v.optional(v.number()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, name, ...updates } = args;

    // If name is provided, set it as workspaceName
    if (name) {
      updates.workspaceName = name;
    }

    await ctx.db.patch(id, updates);
    return true;
  },
});

/**
 * Create integration
 */
export const createIntegration = mutation({
  args: {
    name: v.optional(v.string()),
    apiKey: v.string(),
    isEnabled: v.boolean(),
    autoSyncIntervalMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Use a default name if none provided
    const workspaceName = args.name || "Monday.com Integration";

    // Create the integration, excluding the name field from args
    const { name, ...validArgs } = args;

    const integrationId = await ctx.db.insert("mondayIntegration", {
      apiKey: validArgs.apiKey,
      workspaceId: "",
      workspaceName,
      isEnabled: validArgs.isEnabled,
      autoSyncIntervalMinutes: validArgs.autoSyncIntervalMinutes ?? 60,
      lastConnectionCheck: Date.now(),
      connectionStatus: "pending",
    });

    // Schedule a test connection to update workspace info
    await ctx.scheduler.runAfter(
      0,
      internal.monday.actions.testAndUpdateConnection,
      {
        integrationId,
        apiKey: validArgs.apiKey,
      },
    );

    return { integrationId };
  },
});

/**
 * Get sync logs
 */
export const getSyncLogs = query({
  args: {
    boardMappingId: v.optional(v.id("mondayBoardMappings")),
    status: v.optional(v.string()),
    operation: v.optional(v.string()),
    initiatedBy: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    limit: v.optional(v.number()),
    paginationOpts: v.optional(
      v.object({
        numItems: v.number(),
        cursor: v.union(v.string(), v.null()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // Extract limit from args or use default
    const { limit, paginationOpts, ...filters } = args;

    // Create pagination options from either provided paginationOpts or limit
    const pagination = paginationOpts ?? {
      numItems: limit ?? 10,
      cursor: null,
    };

    // Build query with any filters
    let queryBuilder = ctx.db.query("mondaySyncLogs");

    // Apply filters if provided
    if (filters.boardMappingId) {
      queryBuilder = queryBuilder.withIndex("by_board_mapping", (q) =>
        q.eq("boardMappingId", filters.boardMappingId),
      );
    }

    // Apply ordering and pagination
    const paginatedResult = await queryBuilder
      .order("desc")
      .paginate(pagination);

    // Return just the page array to match frontend expectations
    return paginatedResult.page;
  },
});
