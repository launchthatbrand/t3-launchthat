/**
 * Rules Engine Schema
 *
 * This module defines the database schema for the rules engine.
 */

import { defineTable } from "convex/server";
import { v } from "convex/values";

// Define the rules table
const rulesTable = defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  integrationId: v.id("integrations"),
  isEnabled: v.boolean(),
  triggerType: v.string(),
  triggerConfig: v.string(), // JSON string of trigger configuration
  conditions: v.array(
    v.object({
      type: v.string(),
      config: v.string(), // JSON string of condition configuration
    }),
  ),
  actions: v.array(
    v.object({
      type: v.string(),
      config: v.string(), // JSON string of action configuration
    }),
  ),
  createdBy: v.optional(v.id("users")),
  lastExecuted: v.optional(v.number()),
  executionCount: v.optional(v.number()),
  lastExecutionStatus: v.optional(v.string()), // "success", "error", etc.
  lastError: v.optional(v.string()),
})
  .index("by_integration", ["integrationId"])
  .index("by_enabled", ["isEnabled"])
  .index("by_triggerType", ["triggerType"]);

// Define the rule execution logs table
const ruleExecutionLogsTable = defineTable({
  ruleId: v.id("rules"),
  timestamp: v.number(),
  status: v.string(), // "success", "error", etc.
  executionTimeMs: v.number(),
  triggerData: v.string(), // JSON string of trigger data
  conditionResults: v.string(), // JSON string of condition evaluation results
  actionResults: v.string(), // JSON string of action execution results
  error: v.optional(v.string()),
})
  .index("by_rule", ["ruleId"])
  .index("by_timestamp", ["timestamp"]);

// Export the schema tables
const rulesSchema = {
  tables: {
    rules: rulesTable,
    ruleExecutionLogs: ruleExecutionLogsTable,
  },
};

export default rulesSchema;
