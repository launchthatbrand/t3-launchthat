/**
 * Monday.com Integration Schema
 *
 * This module defines the database schema for the Monday.com integration.
 */

import { defineSchema, defineTable } from "convex/server";

import { v } from "convex/values";

export default defineSchema({
  // Monday.com Integration Configuration
  mondayIntegration: defineTable({
    apiKey: v.string(),
    workspaceId: v.string(),
    workspaceName: v.string(),
    isEnabled: v.boolean(),
    lastSyncTimestamp: v.optional(v.number()),
    lastConnectionCheck: v.optional(v.number()),
    connectionStatus: v.optional(v.string()), // "connected", "error", "pending"
    refreshToken: v.optional(v.string()),
    lastError: v.optional(v.string()),
    consecutiveErrorCount: v.optional(v.number()),
    autoSyncIntervalMinutes: v.optional(v.number()),
    webhookEnabled: v.optional(v.boolean()),
    webhookUrl: v.optional(v.string()),
    pushEnabled: v.optional(v.boolean()),
    pullEnabled: v.optional(v.boolean()),
    // Performance optimization settings
    preferredPageSize: v.optional(v.number()),
    maxConcurrentRequests: v.optional(v.number()),
    rateLimitThreshold: v.optional(v.number()),
    batchSizeOverride: v.optional(v.number()),
    optimizationStrategy: v.optional(v.string()), // "speed", "memory", "balanced"
  }).index("by_enabled", ["isEnabled"]),

  // Board mappings (Convex table <-> Monday.com board)
  mondayBoardMappings: defineTable({
    mondayBoardId: v.string(),
    mondayBoardName: v.string(),
    convexTableName: v.string(),
    convexTableDisplayName: v.optional(v.string()),
    integrationId: v.id("mondayIntegration"),
    isEnabled: v.boolean(),
    syncDirection: v.union(
      v.literal("push"),
      v.literal("pull"),
      v.literal("bidirectional"),
    ),
    syncStatus: v.optional(v.string()), // "synced", "pending", "failed", "partial"
    lastSyncTimestamp: v.optional(v.number()),
    supportsSubitems: v.optional(v.boolean()),
    syncSettings: v.optional(v.string()), // JSON string with advanced settings
    parentMappingId: v.optional(v.id("mondayBoardMappings")), // For subitems support
    parentField: v.optional(v.string()), // Field name that links to parent
  })
    .index("by_integration", ["integrationId"])
    .index("by_enabled", ["isEnabled"])
    .index("by_convex_table", ["convexTableName"])
    .index("by_monday_board", ["mondayBoardId"]),

  // Column mappings (Convex field <-> Monday.com column)
  mondayColumnMappings: defineTable({
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
    transformationRule: v.optional(v.string()), // Rules for value transformations
    mappingConfig: v.optional(v.string()), // JSON string with mapping config
    formatConfig: v.optional(v.string()), // JSON string with format config
  })
    .index("by_board_mapping", ["boardMappingId"])
    .index("by_monday_column", ["boardMappingId", "mondayColumnId"])
    .index("by_convex_field", ["boardMappingId", "convexField"]),

  // Item mappings (Convex document <-> Monday.com item)
  mondayItemMappings: defineTable({
    convexId: v.string(), // ID of the Convex document
    convexTable: v.string(), // Convex table name
    mondayBoardId: v.string(), // Monday.com board ID
    mondayItemId: v.string(), // Monday.com item ID
    boardMappingId: v.id("mondayBoardMappings"), // Reference to the board mapping
    lastSyncTimestamp: v.number(), // Last time the item was synced
    syncStatus: v.string(), // "synced", "pending", "failed"
    isSubitem: v.boolean(), // Whether this is a subitem
    parentItemId: v.optional(v.string()), // Monday.com parent item ID (for subitems)
  })
    .index("by_board_mapping", ["boardMappingId"])
    .index("by_monday_item", ["mondayBoardId", "mondayItemId"])
    .index("by_convex_id", ["convexTable", "convexId"]),

  // Monday.com Sync Logs
  mondaySyncLogs: defineTable({
    recordsProcessed: v.optional(v.number()),
    mondayBoardId: v.optional(v.string()),
    boardMappingId: v.optional(v.id("mondayBoardMappings")),
    integrationId: v.optional(v.id("mondayIntegration")),
    status: v.string(), // "running", "completed", "error", "cancelled"
    syncType: v.string(), // "pull", "push", "bidirectional", "webhook"
    syncDirection: v.optional(v.string()), // "monday_to_convex", "convex_to_monday"
    message: v.optional(v.string()),
    entityType: v.optional(v.string()), // "item", "column", "update", etc.
    details: v.optional(v.string()), // JSON stringified details
    error: v.optional(v.string()),
    stackTrace: v.optional(v.string()),
    startTimestamp: v.number(),
    endTimestamp: v.optional(v.number()),
    // Progress tracking fields
    progressPercentage: v.optional(v.number()),
    progressCurrent: v.optional(v.number()),
    progressTotal: v.optional(v.number()),
    progressMessage: v.optional(v.string()),
  })
    .index("by_board_mapping", ["boardMappingId"])
    .index("by_status", ["status"])
    .index("by_integration", ["integrationId"])
    .index("by_sync_type", ["syncType"])
    .index("by_time", ["startTimestamp"]),

  // Sync Rules for event-based synchronization
  mondaySyncRules: defineTable({
    name: v.string(), // Rule name for display
    description: v.optional(v.string()), // Optional description
    isEnabled: v.boolean(), // Whether the rule is enabled
    integrationId: v.id("mondayIntegration"), // Reference to the integration
    boardMappingId: v.id("mondayBoardMappings"), // Reference to the board mapping

    // Trigger configuration
    triggerType: v.union(
      v.literal("onCreate"), // When a new item is created in Convex
      v.literal("onUpdate"), // When an item is updated in Convex
      v.literal("onStatusChange"), // When a status field changes
      v.literal("onFieldValue"), // When a specific field matches a value
      v.literal("onCheckout"), // When a product is checked out
      v.literal("onSchedule"), // Run on a schedule
      v.literal("onManualTrigger"), // Manually triggered
    ),
    triggerTable: v.string(), // Convex table to watch for events
    triggerField: v.optional(v.string()), // Field to watch for changes (for onUpdate, onStatusChange, onFieldValue)
    triggerValue: v.optional(v.string()), // Value to match (for onFieldValue)
    triggerCondition: v.optional(v.string()), // JSON string with complex condition

    // Action configuration
    actionType: v.union(
      v.literal("push"), // Push to Monday.com
      v.literal("pull"), // Pull from Monday.com
      v.literal("updateField"), // Update a field in Convex
      v.literal("createItem"), // Create a new item in Monday.com
      v.literal("updateItem"), // Update an item in Monday.com
      v.literal("createRelated"), // Create a related item in Monday.com
    ),
    actionConfig: v.string(), // JSON string with action configuration

    // Additional settings
    priority: v.number(), // Rule priority (lower runs first)
    cooldownMs: v.optional(v.number()), // Cooldown period to prevent repeated triggers
    lastExecuted: v.optional(v.number()), // Timestamp of last execution
    executionCount: v.optional(v.number()), // Count of how many times the rule has executed
    createdAt: v.number(), // When the rule was created
    updatedAt: v.number(), // When the rule was last updated
    createdBy: v.optional(v.string()), // User who created the rule
  })
    .index("by_integration", ["integrationId"])
    .index("by_board_mapping", ["boardMappingId"])
    .index("by_enabled", ["isEnabled"])
    .index("by_trigger_type", ["triggerType"])
    .index("by_trigger_table", ["triggerTable"])
    .index("by_priority", ["priority"]),

  // Sync Rule Execution Logs
  mondaySyncRuleExecutions: defineTable({
    ruleId: v.id("mondaySyncRules"), // Reference to the rule
    executedAt: v.number(), // When the rule was executed
    status: v.union(
      v.literal("success"),
      v.literal("error"),
      v.literal("skipped"),
    ),
    triggerDetails: v.string(), // JSON string with trigger details
    executionDetails: v.string(), // JSON string with execution details
    error: v.optional(v.string()), // Error message if failed
    timeTaken: v.number(), // Time taken in milliseconds
  })
    .index("by_rule", ["ruleId"])
    .index("by_time", ["executedAt"])
    .index("by_status", ["status"]),

  // Conflict records for tracking and resolving data conflicts
  mondaySyncConflicts: defineTable({
    boardMappingId: v.id("mondayBoardMappings"), // Reference to the board mapping
    itemMappingId: v.id("mondayItemMappings"), // Reference to the item mapping
    mondayItemId: v.string(), // Monday.com item ID
    convexId: v.string(), // Convex document ID
    convexTable: v.string(), // Convex table name
    detectedAt: v.number(), // When the conflict was detected
    resolvedAt: v.optional(v.number()), // When the conflict was resolved
    status: v.union(
      v.literal("detected"),
      v.literal("resolved_auto"),
      v.literal("resolved_manual"),
      v.literal("unresolved"),
    ), // Conflict status
    resolutionStrategy: v.optional(
      v.union(
        v.literal("latest_wins"),
        v.literal("monday_wins"),
        v.literal("convex_wins"),
        v.literal("manual"),
      ),
    ), // How the conflict was resolved
    resolvedBy: v.optional(v.string()), // Who resolved the conflict
    conflictingFields: v.array(v.string()), // List of fields in conflict
    mondayValues: v.string(), // JSON string with Monday.com values
    convexValues: v.string(), // JSON string with Convex values
    resolvedValues: v.optional(v.string()), // JSON string with resolved values
    lastMondayUpdate: v.optional(v.number()), // Timestamp of last Monday.com update
    lastConvexUpdate: v.optional(v.number()), // Timestamp of last Convex update
    syncLogId: v.optional(v.id("mondaySyncLogs")), // Reference to the sync log
    notes: v.optional(v.string()), // Additional notes
  })
    .index("by_board_mapping", ["boardMappingId"])
    .index("by_item_mapping", ["itemMappingId"])
    .index("by_status", ["status"])
    .index("by_time", ["detectedAt"]),
});
