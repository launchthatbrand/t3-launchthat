import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Schema definition for the Automation Logs table
 *
 * This table stores execution logs for automation scenarios and their individual steps.
 * Each log entry represents either a scenario run or a specific node execution within that run.
 */
export const automationLogsTable = defineTable({
  // Core identification
  scenarioId: v.id("scenarios"), // The scenario this log belongs to
  runId: v.string(), // Unique identifier for a specific run (UUID)
  nodeId: v.optional(v.id("nodes")), // Optional - if this log is for a specific node

  // Execution details
  action: v.string(), // e.g., "scenario_start", "scenario_complete", "node_execute", "webhook_send"
  status: v.union(
    v.literal("running"),
    v.literal("success"),
    v.literal("error"),
    v.literal("skipped"),
    v.literal("cancelled"),
  ),

  // Timing information
  startTime: v.number(), // When the action started
  endTime: v.optional(v.number()), // When the action completed (null if still running)
  duration: v.optional(v.number()), // How long the action took (in ms)

  // Data and context
  inputData: v.optional(v.string()), // JSON string of input data
  outputData: v.optional(v.string()), // JSON string of output data
  errorMessage: v.optional(v.string()), // Error details if status is "error"
  metadata: v.optional(v.string()), // JSON string with additional context

  // Request/Response details (for API calls)
  requestInfo: v.optional(
    v.object({
      endpoint: v.string(),
      method: v.string(),
      headers: v.optional(v.any()),
    }),
  ),
  responseInfo: v.optional(
    v.object({
      statusCode: v.number(),
      statusText: v.string(),
      headers: v.optional(v.any()),
    }),
  ),

  // User context
  userId: v.optional(v.id("users")), // User who triggered this execution

  // Creation timestamp
  timestamp: v.number(),
})
  .index("by_scenario", ["scenarioId"])
  .index("by_run_id", ["runId"])
  .index("by_scenario_and_run", ["scenarioId", "runId"])
  .index("by_timestamp", ["timestamp"])
  .index("by_status", ["status"])
  .index("by_node", ["nodeId"])
  .index("by_user", ["userId"]);

/**
 * Export the automation logs schema
 */
export const automationLogsSchema = defineSchema({
  automationLogs: automationLogsTable,
});
