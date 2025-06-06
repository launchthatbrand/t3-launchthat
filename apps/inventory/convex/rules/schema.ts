import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Rules engine schema definitions
 */
export default defineSchema({
  // Integration configurations
  integrations: defineTable({
    name: v.string(),
    type: v.string(),
    description: v.optional(v.string()),
    isEnabled: v.boolean(),
    apiKey: v.string(),
    apiEndpoint: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    lastConnectionCheck: v.optional(v.number()),
    connectionStatus: v.optional(v.string()),
    lastError: v.optional(v.string()),
    consecutiveErrorCount: v.optional(v.number()),
    config: v.optional(v.string()), // JSON string of configuration options
    metadata: v.optional(v.string()), // JSON string of metadata
    autoSync: v.optional(v.boolean()),
    processSubitems: v.optional(v.boolean()),
  })
    .index("by_type", ["type"])
    .index("by_enabled", ["isEnabled"]),

  // Rules for the rules engine
  rules: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    isEnabled: v.boolean(),
    integrationId: v.id("integrations"),
    integrationName: v.string(), // Added to track integration name
    triggerType: v.string(),
    triggerConfig: v.string(), // JSON string of trigger configuration
    conditions: v.string(), // JSON string of conditions array
    actions: v.string(), // JSON string of actions array
    priority: v.number(), // Required priority field
    cooldownMs: v.optional(v.number()), // Minimum time between rule executions
    lastTriggered: v.optional(v.number()),
    executionCount: v.optional(v.number()),
    lastError: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(), // Added to track creation time
    updatedAt: v.number(), // Added to track update time
    createdBy: v.optional(v.string()), // Added to track who created the rule
    metadata: v.optional(v.string()), // JSON string of metadata
  })
    .index("by_integration", ["integrationId"])
    .index("by_enabled", ["isEnabled"])
    .index("by_trigger_type", ["triggerType"])
    .index("by_priority", ["priority"]),

  // Rule executions - tracks each execution of a rule
  ruleExecutions: defineTable({
    ruleId: v.id("rules"),
    integrationId: v.id("integrations"),
    executedAt: v.number(),
    status: v.union(
      v.literal("success"),
      v.literal("error"),
      v.literal("skipped"),
    ),
    triggered: v.boolean(), // Whether the trigger condition was met
    conditionsMet: v.boolean(), // Whether all conditions were satisfied
    triggerData: v.string(), // JSON string with data that triggered the rule
    actionsExecuted: v.number(), // Number of actions executed
    actionsSucceeded: v.number(), // Number of actions that succeeded
    actionsFailed: v.number(), // Number of actions that failed
    startTime: v.number(), // When execution started
    endTime: v.number(), // When execution ended
    error: v.optional(v.string()), // Error message if execution failed
    details: v.string(), // JSON string with additional execution details
    timeTaken: v.number(), // Time taken for execution in ms
  })
    .index("by_rule", ["ruleId"])
    .index("by_integration", ["integrationId"])
    .index("by_time", ["executedAt"])
    .index("by_status", ["status"]),

  // Rule execution logs - detailed logs for debugging
  ruleExecutionLogs: defineTable({
    executionId: v.id("ruleExecutions"),
    timestamp: v.number(),
    level: v.union(v.literal("info"), v.literal("warn"), v.literal("error")),
    message: v.string(),
    data: v.optional(v.string()), // JSON string with additional context data
    component: v.string(), // 'trigger', 'condition', 'action'
    componentId: v.optional(v.string()), // ID of the specific component
  })
    .index("by_execution", ["executionId"])
    .index("by_level", ["level"])
    .index("by_component", ["component"]),

  // Action results - details of individual action executions
  actionResults: defineTable({
    executionId: v.id("ruleExecutions"),
    ruleId: v.id("rules"),
    integrationId: v.id("integrations"),
    actionType: v.string(),
    actionConfig: v.string(), // JSON string with action configuration
    executedAt: v.number(),
    success: v.boolean(),
    result: v.string(), // JSON string with action result
    error: v.optional(v.string()),
    timeTaken: v.number(),
  })
    .index("by_execution", ["executionId"])
    .index("by_rule", ["ruleId"])
    .index("by_integration", ["integrationId"])
    .index("by_time", ["executedAt"]),

  // Migrations table - track schema migrations
  migrations: defineTable({
    name: v.string(),
    completedAt: v.number(),
    details: v.optional(v.string()), // JSON string with migration details
  }).index("by_name", ["name"]),
});
