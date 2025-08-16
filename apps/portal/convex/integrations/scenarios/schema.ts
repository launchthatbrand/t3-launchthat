import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Configuration for a scenario version
 * Contains the trigger configuration and other scenario-level settings
 */
export const scenarioConfigValidator = v.object({
  triggerKey: v.string(),
  triggerConfig: v.any(), // JSON object with trigger-specific configuration
  enabled: v.optional(v.boolean()), // Whether this configuration is enabled
  schedule: v.optional(v.string()), // Optional cron schedule for automatic execution
  metadata: v.optional(v.any()), // Additional metadata for this configuration version
});

/**
 * Schema definition for the Scenarios table
 *
 * This table stores automation scenarios that can be executed to transfer
 * and transform data between systems. Each scenario represents a workflow
 * of connected nodes that perform specific operations.
 *
 * Supports versioning with draft and published configurations for safe editing.
 */
export const scenariosTable = defineTable({
  // User-friendly name for this scenario (e.g., "Import WordPress Users")
  name: v.string(),

  // Detailed description of what this scenario does
  description: v.string(),

  // Current status: "draft", "active", "inactive", "error"
  status: v.string(),

  // Draft configuration being edited
  draftConfig: scenarioConfigValidator,

  // Published configuration currently in use (null if never published)
  publishedConfig: v.optional(scenarioConfigValidator),

  // Current version number (incremented on each publish)
  version: v.number(),

  // Whether the scenario is currently enabled for execution
  enabled: v.boolean(),

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

  // React Flow UI state for scenario designer
  uiState: v.optional(
    v.object({
      viewport: v.object({
        x: v.number(),
        y: v.number(),
        zoom: v.number(),
      }),
      selectedNodeIds: v.optional(v.array(v.id("nodes"))),
    }),
  ),

  // DEPRECATED FIELDS (for backward compatibility)
  // Optional schedule for automatic execution (cron format) - moved to config
  schedule: v.optional(v.string()),
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
  .index("by_slug", ["slug"])
  // Index for finding enabled scenarios
  .index("by_enabled", ["enabled"])
  // Index for finding scenarios by version
  .index("by_version", ["version"])
  // Index for finding scenarios by trigger key
  .index("by_trigger", ["draftConfig.triggerKey"])
  // Index for published scenarios only
  .index("by_enabled_published", ["enabled", "publishedConfig"])
  // Index for finding scenarios by scenario type
  .index("by_scenario_type", ["scenarioType"])
  // Index for status and owner queries
  .index("by_status_and_owner", ["status", "ownerId"]);

/**
 * Export the scenarios schema
 */
export const integrationsScenariosSchema = {
  scenarios: scenariosTable,
};
