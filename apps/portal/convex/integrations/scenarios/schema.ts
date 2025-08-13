import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Schema definition for the Scenarios table
 *
 * This table stores automation scenarios that can be executed to transfer
 * and transform data between systems. Each scenario represents a workflow
 * of connected nodes that perform specific operations.
 */
export const scenariosTable = defineTable({
  // User-friendly name for this scenario (e.g., "Import WordPress Users")
  name: v.string(),

  // Detailed description of what this scenario does
  description: v.string(),

  // Current status: "draft", "active", "inactive", "error"
  status: v.string(),

  // Optional schedule for automatic execution (cron format)
  schedule: v.optional(v.string()),

  // Optional slug for addressable scenarios (e.g., checkout flows)
  slug: v.optional(v.string()),

  // Scenario type classification: general | checkout (optional for backward compatibility)
  scenarioType: v.optional(
    v.union(v.literal("general"), v.literal("checkout")),
  ),

  // Timestamp of last execution
  lastExecutedAt: v.optional(v.number()),

  // Result of last execution: "success", "error", null if never executed
  lastExecutionResult: v.optional(v.string()),

  // Error message if last execution failed
  lastExecutionError: v.optional(v.string()),

  // User ID who created this scenario
  ownerId: v.id("users"),

  // Creation timestamp
  createdAt: v.number(),

  // Last update timestamp
  updatedAt: v.number(),
})
  // Index for looking up scenarios by status
  .index("by_status", ["status"])
  // Index for looking up scenarios by owner
  .index("by_owner", ["ownerId"])
  // Index for finding scenarios by name
  .index("by_name", ["name"])
  // Index for finding scenarios by owner and status
  .index("by_owner_and_status", ["ownerId", "status"])
  // Index for finding scenarios by slug (used for checkout flows)
  .index("by_slug", ["slug"]);

/**
 * Export the scenarios schema
 */
export const integrationsScenariosSchema = {
  scenarios: scenariosTable,
};
