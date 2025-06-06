/**
 * Monday.com Integration Queries
 *
 * This module contains query functions for the Monday.com integration.
 * Queries are used for operations that read data from the Convex database.
 */

import { QueryCtx, internalQuery, query } from "../_generated/server";

import { Id } from "../_generated/dataModel";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

/**
 * Get all configured Monday.com integrations
 */
export const getIntegrations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("mondayIntegration").collect();
  },
});

/**
 * Get the Monday.com integration
 */
export const getIntegration = query({
  args: {},
  handler: async (ctx) => {
    // Get the first Monday.com integration (should only be one)
    const integration = await ctx.db.query("mondayIntegration").first();
    return integration;
  },
});

/**
 * Get the Monday.com integration configuration (backward compatibility)
 */
export const getIntegrationConfig = query({
  args: {},
  handler: async (ctx) => {
    // Get the first Monday.com integration (should only be one)
    const integration = await ctx.db.query("mondayIntegration").first();
    return integration;
  },
});

/**
 * Get all board mappings for the Monday.com integration
 */
export const getBoardMappings = query({
  args: { integrationId: v.id("mondayIntegration") },
  handler: async (ctx, args) => {
    // Fetch all board mappings for this integration
    const boardMappings = await ctx.db
      .query("mondayBoardMappings")
      .withIndex("by_integration", (q) =>
        q.eq("integrationId", args.integrationId),
      )
      .collect();

    return boardMappings;
  },
});

/**
 * Get a specific board mapping
 */
export const getBoardMapping = query({
  args: {
    id: v.id("mondayBoardMappings"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get column mappings for a board
 */
export const getColumnMappings = query({
  args: {
    boardMappingId: v.id("mondayBoardMappings"),
  },
  handler: async (ctx, args) => {
    // Get all column mappings for the board
    const columnMappings = await ctx.db
      .query("mondayColumnMappings")
      .withIndex("by_board_mapping", (q) =>
        q.eq("boardMappingId", args.boardMappingId),
      )
      .collect();

    return columnMappings;
  },
});

/**
 * Get synchronization stats for the Monday.com integration
 */
export const getSyncStats = query({
  args: {},
  handler: async (ctx) => {
    // Get the Monday.com integration
    const integration = await ctx.db.query("mondayIntegration").first();
    if (!integration) return null;

    // Get all board mappings for the integration
    const boardMappings = await ctx.db
      .query("mondayBoardMappings")
      .withIndex("by_integration", (q) =>
        q.eq("integrationId", integration._id),
      )
      .collect();

    // Calculate stats
    const totalMappings = boardMappings.length;
    const enabledMappings = boardMappings.filter((m) => m.isEnabled).length;
    const syncedMappings = boardMappings.filter(
      (m) => m.syncStatus === "synced",
    ).length;
    const errorMappings = boardMappings.filter(
      (m) => m.syncStatus === "error",
    ).length;
    const pendingMappings = boardMappings.filter(
      (m) => m.syncStatus === "pending",
    ).length;
    const syncingMappings = boardMappings.filter(
      (m) => m.syncStatus === "syncing",
    ).length;
    const partialMappings = boardMappings.filter(
      (m) => m.syncStatus === "partial",
    ).length;

    // Get the last sync time
    const lastSyncTime = integration.lastSyncTimestamp ?? 0;

    return {
      totalMappings,
      enabledMappings,
      syncedMappings,
      errorMappings,
      pendingMappings,
      syncingMappings,
      partialMappings,
      lastSyncTime,
    };
  },
});

/**
 * Get the latest sync log for a specific board mapping
 */
export const getLatestSyncLog = internalQuery({
  args: {
    boardMappingId: v.id("mondayBoardMappings"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("mondaySyncLogs")
      .withIndex("by_board_mapping", (q) =>
        q.eq("boardMappingId", args.boardMappingId),
      )
      .order("desc")
      .first();
  },
});

/**
 * Get sync logs with pagination
 */
export const getSyncLogs = query({
  args: {
    boardMappingId: v.optional(v.id("mondayBoardMappings")),
    status: v.optional(v.string()),
    operation: v.optional(v.string()),
    initiatedBy: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    let queryBuilder = ctx.db.query("mondaySyncLogs");

    // First, apply a primary index if possible
    if (args.boardMappingId) {
      queryBuilder = queryBuilder.withIndex("by_board_mapping", (q) =>
        q.eq("boardMappingId", args.boardMappingId),
      );
    } else if (args.status) {
      queryBuilder = queryBuilder.withIndex("by_status", (q) =>
        q.eq("status", args.status),
      );
    } else if (args.startTime) {
      queryBuilder = queryBuilder.withIndex("by_time", (q) =>
        q.gte("startTimestamp", args.startTime),
      );
    }

    // Then apply secondary filters using filter()
    if (args.operation) {
      queryBuilder = queryBuilder.filter((q) =>
        q.eq(q.field("operation"), args.operation),
      );
    }

    if (args.initiatedBy) {
      queryBuilder = queryBuilder.filter((q) =>
        q.eq(q.field("initiatedBy"), args.initiatedBy),
      );
    }

    // Handle time range if end time is specified
    if (args.endTime) {
      queryBuilder = queryBuilder.filter((q) =>
        q.lte(q.field("startTimestamp"), args.endTime),
      );
    }

    return await queryBuilder.order("desc").paginate(args.paginationOpts);
  },
});

/**
 * Get detailed sync log by ID
 */
export const getSyncLogDetails = query({
  args: {
    id: v.id("mondaySyncLogs"),
  },
  handler: async (ctx, args) => {
    const syncLog = await ctx.db.get(args.id);
    if (!syncLog) return null;

    let recordChanges = [];
    let errors = [];
    let performanceMetrics = [];
    let messages = [];
    let phases = [];
    let metrics = null;

    // Parse JSON string fields
    try {
      if (syncLog.recordChanges) {
        recordChanges = JSON.parse(syncLog.recordChanges as string);
      }
      if (syncLog.errors) {
        errors = JSON.parse(syncLog.errors as string);
      }
      if (syncLog.performanceMetrics) {
        performanceMetrics = JSON.parse(syncLog.performanceMetrics as string);
      }
      if (syncLog.messages) {
        messages = JSON.parse(syncLog.messages as string);
      }
      if (syncLog.phases) {
        phases = JSON.parse(syncLog.phases as string);
      }
      if (syncLog.metrics) {
        metrics = JSON.parse(syncLog.metrics as string);
      }
    } catch (error) {
      console.error("Error parsing JSON fields from sync log:", error);
    }

    // Get board mapping details if available
    let boardMapping = null;
    if (syncLog.boardMappingId) {
      boardMapping = await ctx.db.get(syncLog.boardMappingId);
    }

    // Return formatted log with parsed JSON fields
    return {
      ...syncLog,
      recordChanges,
      errors,
      performanceMetrics,
      messages,
      phases,
      metrics,
      boardMapping,
    };
  },
});

/**
 * Get sync logs summary (aggregated statistics)
 */
export const getSyncLogsSummary = query({
  args: {
    boardMappingId: v.optional(v.id("mondayBoardMappings")),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    operation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let queryBuilder = ctx.db.query("mondaySyncLogs");

    // Apply primary index for filtering
    if (args.boardMappingId) {
      queryBuilder = queryBuilder.withIndex("by_board_mapping", (q) =>
        q.eq("boardMappingId", args.boardMappingId),
      );
    } else if (args.operation) {
      queryBuilder = queryBuilder.withIndex("by_operation", (q) =>
        q.eq("operation", args.operation),
      );
    }

    // Apply time range filter if provided
    if (args.startTime && args.endTime) {
      queryBuilder = queryBuilder.filter((q) =>
        q.and(
          q.gte(q.field("startTimestamp"), args.startTime),
          q.lte(
            q.field("startTimestamp"),
            args.endTime ?? Number.MAX_SAFE_INTEGER,
          ),
        ),
      );
    }

    const logs = await queryBuilder.collect();

    // Aggregate statistics
    const total = logs.length;
    const completed = logs.filter((log) => log.status === "completed").length;
    const failed = logs.filter((log) => log.status === "failed").length;
    const inProgress = logs.filter(
      (log) => log.status === "in-progress",
    ).length;
    const completedWithErrors = logs.filter(
      (log) => log.status === "completed_with_errors",
    ).length;

    // Calculate totals
    let totalRecordsProcessed = 0;
    let totalRecordsCreated = 0;
    let totalRecordsUpdated = 0;
    let totalRecordsFailed = 0;
    let totalTimeTaken = 0;

    for (const log of logs) {
      totalRecordsProcessed += (log.recordsProcessed as number) || 0;
      totalRecordsCreated += (log.recordsCreated as number) || 0;
      totalRecordsUpdated += (log.recordsUpdated as number) || 0;
      totalRecordsFailed += (log.recordsFailed as number) || 0;
      totalTimeTaken += (log.timeTaken as number) || 0;
    }

    // Calculate averages
    const avgRecordsProcessed = total > 0 ? totalRecordsProcessed / total : 0;
    const avgTimeTaken = total > 0 ? totalTimeTaken / total : 0;
    const successRate =
      totalRecordsProcessed > 0
        ? ((totalRecordsCreated + totalRecordsUpdated) /
            totalRecordsProcessed) *
          100
        : 0;

    // Get latest log
    const latestLog =
      logs.length > 0
        ? logs.sort(
            (a, b) =>
              (b.startTimestamp as number) - (a.startTimestamp as number),
          )[0]
        : null;

    return {
      total,
      completed,
      failed,
      inProgress,
      completedWithErrors,
      totalRecordsProcessed,
      totalRecordsCreated,
      totalRecordsUpdated,
      totalRecordsFailed,
      totalTimeTaken,
      avgRecordsProcessed,
      avgTimeTaken,
      successRate,
      latestSync: latestLog
        ? {
            id: latestLog._id,
            operation: latestLog.operation,
            status: latestLog.status,
            startTimestamp: latestLog.startTimestamp,
            endTimestamp: latestLog.endTimestamp,
          }
        : null,
    };
  },
});

/**
 * Get recent errors from sync logs
 */
export const getRecentSyncErrors = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // Get logs with failed status
    const errorLogs = await ctx.db
      .query("mondaySyncLogs")
      .withIndex("by_status", (q) => q.eq("status", "failed"))
      .order("desc")
      .take(limit);

    return errorLogs.map((log) => ({
      id: log._id,
      operation: log.operation,
      startTimestamp: log.startTimestamp,
      error: log.error,
      errorDetails: log.errorDetails,
      boardMappingId: log.boardMappingId,
    }));
  },
});

/**
 * Get all tables and their fields for mapping
 */
export const getTableFields = query({
  args: {},
  handler: () => {
    // Simplified schema that we offer for syncing
    // In a real implementation, this would dynamically read the schema
    const tables = [
      {
        name: "products",
        displayName: "Products",
        fields: [
          { name: "name", type: "string", isRequired: true },
          { name: "description", type: "string", isRequired: false },
          { name: "price", type: "number", isRequired: true },
          { name: "sku", type: "string", isRequired: false },
          { name: "inventory", type: "number", isRequired: false },
          { name: "categories", type: "array", isRequired: false },
          { name: "isActive", type: "boolean", isRequired: false },
          { name: "createdAt", type: "date", isRequired: false },
          { name: "updatedAt", type: "date", isRequired: false },
        ],
      },
      {
        name: "orders",
        displayName: "Orders",
        fields: [
          { name: "orderNumber", type: "string", isRequired: true },
          { name: "customerName", type: "string", isRequired: true },
          { name: "customerEmail", type: "string", isRequired: false },
          { name: "total", type: "number", isRequired: true },
          { name: "status", type: "string", isRequired: true },
          { name: "paymentStatus", type: "string", isRequired: false },
          { name: "shippingAddress", type: "object", isRequired: false },
          { name: "lineItems", type: "array", isRequired: true },
          { name: "createdAt", type: "date", isRequired: false },
        ],
      },
      {
        name: "customers",
        displayName: "Customers",
        fields: [
          { name: "name", type: "string", isRequired: true },
          { name: "email", type: "string", isRequired: false },
          { name: "phone", type: "string", isRequired: false },
          { name: "address", type: "object", isRequired: false },
          { name: "totalOrders", type: "number", isRequired: false },
          { name: "totalSpent", type: "number", isRequired: false },
          { name: "notes", type: "string", isRequired: false },
        ],
      },
    ];

    return tables;
  },
});

/**
 * Get available tables for mapping (backward compatibility)
 */
export const getAvailableTables = query({
  args: {},
  handler: () => {
    // Simplified schema that we offer for syncing
    // In a real implementation, this would dynamically read the schema
    const tables = [
      {
        name: "products",
        displayName: "Products",
        fields: [
          { name: "name", type: "string", isRequired: true },
          { name: "description", type: "string", isRequired: false },
          { name: "price", type: "number", isRequired: true },
          { name: "sku", type: "string", isRequired: false },
          { name: "inventory", type: "number", isRequired: false },
          { name: "categories", type: "array", isRequired: false },
          { name: "isActive", type: "boolean", isRequired: false },
          { name: "createdAt", type: "date", isRequired: false },
          { name: "updatedAt", type: "date", isRequired: false },
        ],
      },
      {
        name: "orders",
        displayName: "Orders",
        fields: [
          { name: "orderNumber", type: "string", isRequired: true },
          { name: "customerName", type: "string", isRequired: true },
          { name: "customerEmail", type: "string", isRequired: false },
          { name: "total", type: "number", isRequired: true },
          { name: "status", type: "string", isRequired: true },
          { name: "paymentStatus", type: "string", isRequired: false },
          { name: "shippingAddress", type: "object", isRequired: false },
          { name: "lineItems", type: "array", isRequired: true },
          { name: "createdAt", type: "date", isRequired: false },
        ],
      },
      {
        name: "customers",
        displayName: "Customers",
        fields: [
          { name: "name", type: "string", isRequired: true },
          { name: "email", type: "string", isRequired: false },
          { name: "phone", type: "string", isRequired: false },
          { name: "address", type: "object", isRequired: false },
          { name: "totalOrders", type: "number", isRequired: false },
          { name: "totalSpent", type: "number", isRequired: false },
          { name: "notes", type: "string", isRequired: false },
        ],
      },
    ];

    return tables;
  },
});

/**
 * Get all sync rules for an integration
 */
export const getSyncRules = query({
  args: {
    integrationId: v.id("mondayIntegration"),
  },
  handler: async (ctx, args) => {
    const rules = await ctx.db
      .query("mondaySyncRules")
      .withIndex("by_integration", (q) =>
        q.eq("integrationId", args.integrationId),
      )
      .collect();

    return rules;
  },
});

/**
 * Get sync rules for a specific board mapping
 */
export const getSyncRulesByBoardMapping = query({
  args: {
    boardMappingId: v.id("mondayBoardMappings"),
  },
  handler: async (ctx, args) => {
    const rules = await ctx.db
      .query("mondaySyncRules")
      .withIndex("by_board_mapping", (q) =>
        q.eq("boardMappingId", args.boardMappingId),
      )
      .collect();

    return rules;
  },
});

/**
 * Get a single sync rule by ID
 */
export const getSyncRule = query({
  args: {
    ruleId: v.id("mondaySyncRules"),
  },
  handler: async (ctx, args) => {
    const rule = await ctx.db.get(args.ruleId);
    return rule;
  },
});

/**
 * Get sync rules for a specific table
 */
export const getSyncRulesByTable = query({
  args: {
    triggerTable: v.string(),
  },
  handler: async (ctx, args) => {
    const rules = await ctx.db
      .query("mondaySyncRules")
      .withIndex("by_trigger_table", (q) =>
        q.eq("triggerTable", args.triggerTable),
      )
      .collect();

    return rules;
  },
});

/**
 * Get sync rule execution logs for a specific rule
 */
export const getSyncRuleExecutions = query({
  args: {
    ruleId: v.id("mondaySyncRules"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const executions = await ctx.db
      .query("mondaySyncRuleExecutions")
      .withIndex("by_rule", (q) => q.eq("ruleId", args.ruleId))
      .order("desc", (q) => q.field("executedAt"))
      .take(limit);

    return executions;
  },
});

/**
 * Get summary statistics for rule executions
 */
export const getSyncRuleExecutionStats = query({
  args: {
    ruleId: v.optional(v.id("mondaySyncRules")),
    timeRange: v.optional(v.number()), // Time range in milliseconds (e.g., 24 * 60 * 60 * 1000 for 24 hours)
  },
  handler: async (ctx, args) => {
    let executions;
    const now = Date.now();
    const timeRange = args.timeRange || 7 * 24 * 60 * 60 * 1000; // Default to 7 days
    const startTime = now - timeRange;

    if (args.ruleId) {
      // Get executions for a specific rule
      executions = await ctx.db
        .query("mondaySyncRuleExecutions")
        .withIndex("by_rule", (q) => q.eq("ruleId", args.ruleId))
        .filter((q) => q.gt(q.field("executedAt"), startTime))
        .collect();
    } else {
      // Get all executions
      executions = await ctx.db
        .query("mondaySyncRuleExecutions")
        .withIndex("by_time", (q) => q.gt("executedAt", startTime))
        .collect();
    }

    // Calculate statistics
    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(
      (e) => e.status === "success",
    ).length;
    const failedExecutions = executions.filter(
      (e) => e.status === "error",
    ).length;
    const skippedExecutions = executions.filter(
      (e) => e.status === "skipped",
    ).length;

    const averageTimeTaken =
      totalExecutions > 0
        ? executions.reduce((sum, e) => sum + e.timeTaken, 0) / totalExecutions
        : 0;

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      skippedExecutions,
      successRate:
        totalExecutions > 0
          ? (successfulExecutions / totalExecutions) * 100
          : 0,
      averageTimeTaken,
      timeRange,
    };
  },
});

/**
 * Get available tables for rule configuration
 */
export const getAvailableTablesForRules = query({
  handler: async (ctx) => {
    // In a real implementation, this would fetch from your schema
    // or database metadata. For demonstration, return hardcoded values.
    return [
      { name: "products", displayName: "Products" },
      { name: "orders", displayName: "Orders" },
      { name: "customers", displayName: "Customers" },
      { name: "inventory", displayName: "Inventory" },
      { name: "shipments", displayName: "Shipments" },
    ];
  },
});

// Implement methods for retrieving board mapping columns and fields for column value mapping
export const getMondayColumns = query({
  args: { boardMappingId: v.string() },
  handler: async (ctx, args) => {
    // Get the board mapping
    const boardMapping = await ctx.db
      .query("mondayBoardMappings")
      .filter((q) => q.eq(q.field("_id"), args.boardMappingId))
      .unique();

    if (!boardMapping) {
      return [];
    }

    // If there are cached columns, return them
    if (
      boardMapping.mondayColumns &&
      Array.isArray(boardMapping.mondayColumns)
    ) {
      return boardMapping.mondayColumns;
    }

    // Otherwise, return an empty array
    // (columns would normally be fetched from Monday.com API)
    return [];
  },
});

export const getConvexFields = query({
  args: { boardMappingId: v.string() },
  handler: async (ctx, args) => {
    // Get the board mapping
    const boardMapping = await ctx.db
      .query("mondayBoardMappings")
      .filter((q) => q.eq(q.field("_id"), args.boardMappingId))
      .unique();

    if (!boardMapping) {
      return [];
    }

    // If there are cached fields, return them
    if (boardMapping.convexFields && Array.isArray(boardMapping.convexFields)) {
      return boardMapping.convexFields;
    }

    // Otherwise, return some default fields based on the table name
    const tableName = boardMapping.convexTableName;

    // Return a set of default fields based on common table schemas
    if (tableName === "products") {
      return [
        { name: "name", displayName: "Product Name" },
        { name: "description", displayName: "Description" },
        { name: "price", displayName: "Price" },
        { name: "status", displayName: "Status" },
        { name: "sku", displayName: "SKU" },
      ];
    } else if (tableName === "orders") {
      return [
        { name: "orderNumber", displayName: "Order Number" },
        { name: "customerName", displayName: "Customer Name" },
        { name: "status", displayName: "Status" },
        { name: "total", displayName: "Total Amount" },
      ];
    } else if (tableName === "customers") {
      return [
        { name: "name", displayName: "Customer Name" },
        { name: "email", displayName: "Email" },
        { name: "phone", displayName: "Phone" },
        { name: "status", displayName: "Status" },
      ];
    } else {
      // Default fields for unknown tables
      return [
        { name: "name", displayName: "Name" },
        { name: "description", displayName: "Description" },
        { name: "status", displayName: "Status" },
      ];
    }
  },
});

export const getAvailableDocumentsForTesting = query({
  args: {
    integrationId: v.id("mondayIntegration"),
    ruleId: v.optional(v.id("mondaySyncRules")),
    triggerTable: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the rule if a ruleId is provided
    let triggerTable = args.triggerTable;

    if (args.ruleId && !triggerTable) {
      const rule = await ctx.db.get(args.ruleId);
      if (rule) {
        triggerTable = rule.triggerTable;
      }
    }

    if (!triggerTable) {
      return [];
    }

    // Get sample documents from the specified table
    // This is a simplified version - in a real implementation,
    // you would query the actual table and return real IDs

    // For demonstration purposes, generate some fake document IDs
    const sampleDocuments = [];

    // Generate different sample documents based on table type
    if (triggerTable === "products") {
      sampleDocuments.push(
        { id: "1234567890123456", label: "Sample Product 1" },
        { id: "2345678901234567", label: "Sample Product 2" },
        { id: "3456789012345678", label: "Sample Product 3" },
      );
    } else if (triggerTable === "orders") {
      sampleDocuments.push(
        { id: "4567890123456789", label: "Order #1001" },
        { id: "5678901234567890", label: "Order #1002" },
        { id: "6789012345678901", label: "Order #1003" },
      );
    } else if (triggerTable === "customers") {
      sampleDocuments.push(
        { id: "7890123456789012", label: "Customer: John Doe" },
        { id: "8901234567890123", label: "Customer: Jane Smith" },
        { id: "9012345678901234", label: "Customer: Bob Johnson" },
      );
    } else {
      // Default samples for any other table
      sampleDocuments.push(
        { id: "abcdef1234567890", label: "Sample Record 1" },
        { id: "bcdef1234567890a", label: "Sample Record 2" },
        { id: "cdef1234567890ab", label: "Sample Record 3" },
      );
    }

    return sampleDocuments;
  },
});

// Get sync rule counts for each integration
export const getSyncRuleCounts = query({
  handler: async (ctx) => {
    // Get all sync rules
    const rules = await ctx.db.query("mondaySyncRules").collect();

    // Count rules per integration
    const counts: Record<string, number> = {};

    for (const rule of rules) {
      const integrationId = rule.integrationId;

      if (!counts[integrationId]) {
        counts[integrationId] = 0;
      }

      counts[integrationId]++;
    }

    return counts;
  },
});

/**
 * Get sync conflicts for a board mapping
 */
export const getSyncConflictsForBoard = query({
  args: {
    boardMappingId: v.id("mondayBoardMappings"),
    status: v.optional(
      v.union(
        v.literal("detected"),
        v.literal("resolved_auto"),
        v.literal("resolved_manual"),
        v.literal("unresolved"),
      ),
    ),
    onlyUnresolved: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("mondaySyncConflicts")
      .withIndex("by_board_mapping", (q) =>
        q.eq("boardMappingId", args.boardMappingId),
      );

    // Filter by status if provided
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    } else if (args.onlyUnresolved) {
      // Filter for unresolved conflicts
      query = query.filter((q) => q.eq(q.field("status"), "detected"));
    }

    // Apply limit if provided
    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.collect();
  },
});

/**
 * Get sync conflict details by ID
 */
export const getSyncConflictById = query({
  args: {
    conflictId: v.id("mondaySyncConflicts"),
  },
  handler: async (ctx, args) => {
    const conflict = await ctx.db.get(args.conflictId);

    if (!conflict) {
      return null;
    }

    // Get related entities for more context
    const boardMapping = await ctx.db.get(conflict.boardMappingId);
    const itemMapping = await ctx.db.get(conflict.itemMappingId);

    // Parse JSON string values
    let mondayValues = {};
    let convexValues = {};
    let resolvedValues = null;

    try {
      mondayValues = JSON.parse(conflict.mondayValues);
      convexValues = JSON.parse(conflict.convexValues);

      if (conflict.resolvedValues) {
        resolvedValues = JSON.parse(conflict.resolvedValues);
      }
    } catch (error) {
      console.error("Error parsing conflict values:", error);
    }

    // Format conflicting fields with their values
    const fieldConflicts = conflict.conflictingFields.map((field) => ({
      field,
      mondayValue: mondayValues[field],
      convexValue: convexValues[field],
      resolvedValue: resolvedValues ? resolvedValues[field] : undefined,
      isResolved: !!resolvedValues,
    }));

    return {
      ...conflict,
      boardMapping,
      itemMapping,
      mondayValues,
      convexValues,
      resolvedValues,
      fieldConflicts,
    };
  },
});

/**
 * Get sync conflicts statistics for a board mapping
 */
export const getSyncConflictsStats = query({
  args: {
    boardMappingId: v.id("mondayBoardMappings"),
  },
  handler: async (ctx, args) => {
    const boardMapping = await ctx.db.get(args.boardMappingId);
    if (!boardMapping) {
      return null;
    }

    // Count conflicts by status
    const allConflicts = await ctx.db
      .query("mondaySyncConflicts")
      .withIndex("by_board_mapping", (q) =>
        q.eq("boardMappingId", args.boardMappingId),
      )
      .collect();

    const detected = allConflicts.filter((c) => c.status === "detected").length;
    const resolvedAuto = allConflicts.filter(
      (c) => c.status === "resolved_auto",
    ).length;
    const resolvedManual = allConflicts.filter(
      (c) => c.status === "resolved_manual",
    ).length;
    const unresolved = allConflicts.filter(
      (c) => c.status === "unresolved",
    ).length;

    const lastDetected = allConflicts
      .filter((c) => c.status === "detected")
      .sort((a, b) => b.detectedAt - a.detectedAt)[0]?.detectedAt;

    return {
      boardMapping,
      total: allConflicts.length,
      detected,
      resolvedAuto,
      resolvedManual,
      unresolved,
      totalResolved: resolvedAuto + resolvedManual,
      hasUnresolved: detected > 0 || unresolved > 0,
      lastDetectedAt: lastDetected,
    };
  },
});

/**
 * Get the latest sync logs
 */
export const getLatestSyncLogs = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
    boardMappingId: v.optional(v.id("mondayBoardMappings")),
  },
  handler: async (ctx, args) => {
    let syncLogsQuery = ctx.db
      .query("mondaySyncLogs")
      .order("desc")
      .take(args.limit || 10);

    // Apply filters if provided
    if (args.status) {
      syncLogsQuery = ctx.db
        .query("mondaySyncLogs")
        .withIndex("by_status", (q) => q.eq("status", args.status))
        .order("desc")
        .take(args.limit || 10);
    }

    if (args.boardMappingId) {
      syncLogsQuery = ctx.db
        .query("mondaySyncLogs")
        .withIndex("by_board_mapping", (q) =>
          q.eq("boardMappingId", args.boardMappingId),
        )
        .order("desc")
        .take(args.limit || 10);
    }

    if (args.status && args.boardMappingId) {
      // For multiple filters we need to use either filter() or combine multiple queries
      syncLogsQuery = ctx.db
        .query("mondaySyncLogs")
        .withIndex("by_board_mapping", (q) =>
          q.eq("boardMappingId", args.boardMappingId),
        )
        .filter((q) => q.eq(q.field("status"), args.status))
        .order("desc")
        .take(args.limit || 10);
    }

    return syncLogsQuery;
  },
});

/**
 * Get details for a specific sync log
 */
export const getSyncLogById = query({
  args: {
    id: v.id("mondaySyncLogs"),
  },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
