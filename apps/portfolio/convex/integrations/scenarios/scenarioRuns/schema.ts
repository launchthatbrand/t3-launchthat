import { defineTable } from "convex/server";
import { v } from "convex/values";

export const scenarioRunsTable = defineTable({
  scenarioId: v.id("scenarios"),
  scenarioVersion: v.number(), // Track which version of the scenario was used
  status: v.union(
    v.literal("pending"),
    v.literal("running"),
    v.literal("succeeded"),
    v.literal("failed"),
    v.literal("cancelled"),
  ),
  triggerKey: v.string(),
  connectionId: v.optional(v.id("connections")),
  correlationId: v.string(),
  startedAt: v.number(),
  finishedAt: v.optional(v.number()),
})
  .index("by_scenario", ["scenarioId"])
  .index("by_status_and_time", ["status", "startedAt"])
  .index("by_correlation", ["correlationId"])
  .index("by_scenario_version", ["scenarioId", "scenarioVersion"]);

export const integrationsScenarioRunsSchema = {
  scenarioRuns: scenarioRunsTable,
};
