import { defineTable } from "convex/server";
import { v } from "convex/values";

export const scenarioLogsTable = defineTable({
  // Core identification
  scenarioId: v.id("scenarios"),
  runId: v.id("scenarioRuns"),
  nodeId: v.optional(v.id("nodes")),

  // Execution details
  action: v.string(),
  status: v.union(
    v.literal("running"),
    v.literal("success"),
    v.literal("error"),
    v.literal("skipped"),
    v.literal("cancelled"),
  ),

  // Timing information
  startTime: v.number(),
  endTime: v.optional(v.number()),
  duration: v.optional(v.number()),

  // Data and context
  inputData: v.optional(v.string()),
  outputData: v.optional(v.string()),
  errorMessage: v.optional(v.string()),
  metadata: v.optional(v.string()),

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
  userId: v.optional(v.id("users")),

  // Creation timestamp
  timestamp: v.number(),
})
  .index("by_scenario", ["scenarioId"])
  .index("by_run", ["runId"])
  .index("by_scenario_and_run", ["scenarioId", "runId"])
  .index("by_timestamp", ["timestamp"])
  .index("by_status", ["status"])
  .index("by_node", ["nodeId"])
  .index("by_user", ["userId"]);

export const integrationsScenarioLogsSchema = {
  scenarioLogs: scenarioLogsTable,
};
