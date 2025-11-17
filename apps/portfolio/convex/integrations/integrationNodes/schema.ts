import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Schema definition for the Integration Nodes table
 *
 * This table stores the master definitions of all available integration nodes.
 * These are seeded from code and represent the "types" of nodes available.
 */
export const integrationNodesTable = defineTable({
  // Unique identifier from code (e.g., "wordpress_create_post")
  identifier: v.string(),

  // Display name
  name: v.string(),

  // Node category: "action", "trigger", "transformer", "system"
  category: v.string(),

  // Integration type: "wordpress", "stripe", "monday", "system", etc.
  integrationType: v.string(),

  // Description of what this node does
  description: v.string(),

  // JSON schema for input validation
  inputSchema: v.string(),

  // JSON schema for output validation
  outputSchema: v.string(),

  // JSON schema for configuration/settings
  configSchema: v.string(),

  // UI configuration (forms, examples, documentation)
  uiConfig: v.optional(v.string()),

  // Version for handling updates
  version: v.string(),

  // Whether this node is deprecated
  deprecated: v.optional(v.boolean()),

  // Tags for categorization and search
  tags: v.optional(v.array(v.string())),

  // Creation timestamp
  createdAt: v.number(),

  // Last update timestamp
  updatedAt: v.number(),
})
  .index("by_identifier", ["identifier"])
  .index("by_category", ["category"])
  .index("by_integration_type", ["integrationType"])
  .index("by_version", ["identifier", "version"])
  .index("by_tags", ["tags"]);

/**
 * Schema definition for the Scenario Nodes table
 *
 * This table stores individual node instances in automation scenarios.
 * Each record represents a specific usage of an integration node.
 */
export const scenarioNodesTable = defineTable({
  // Reference to the scenario this node belongs to
  scenarioId: v.id("scenarios"),

  // Reference to the integration node definition
  integrationNodeId: v.id("integrationNodes"),

  // User-defined label for this instance
  label: v.string(),

  // Optional reference to the connection this node uses
  connectionId: v.optional(v.id("connections")),

  // User's configuration for this specific instance
  config: v.any(),

  // Optional JSON describing the fields emitted by this node when it runs
  outputSchema: v.optional(v.string()),

  // Optional JSON template mapping of this node's expected inputs
  inputMapping: v.optional(v.string()),

  // Optional JSON string containing raw sample data returned from a test run
  sampleData: v.optional(v.string()),

  // Position in the visual editor (JSON with x, y coordinates) - LEGACY
  position: v.string(),

  // Execution order in the scenario (used for non-branching scenarios)
  order: v.optional(v.number()),

  // Whether this node is a system node that cannot be deleted
  isSystem: v.optional(v.boolean()),

  // Optional list of property names that should be locked from edits
  lockedProperties: v.optional(v.array(v.string())),

  // React Flow specific properties
  rfType: v.optional(v.string()),
  rfPosition: v.optional(
    v.object({
      x: v.number(),
      y: v.number(),
    }),
  ),
  rfLabel: v.optional(v.string()),
  rfWidth: v.optional(v.number()),
  rfHeight: v.optional(v.number()),

  // Creation timestamp
  createdAt: v.number(),

  // Last update timestamp
  updatedAt: v.number(),
})
  // Index for looking up nodes by scenario
  .index("by_scenario", ["scenarioId"])
  // Index for looking up nodes by integration type
  .index("by_integration_node", ["integrationNodeId"])
  // Index for looking up nodes by scenario and integration type
  .index("by_scenario_and_integration", ["scenarioId", "integrationNodeId"])
  // Index for looking up nodes by scenario and order
  .index("by_scenario_and_order", ["scenarioId", "order"])
  // Index for looking up nodes by connection
  .index("by_connection", ["connectionId"]);

/**
 * Export the nodes schemas
 */
export const integrationsNodesSchema = {
  integrationNodes: integrationNodesTable,
  scenarioNodes: scenarioNodesTable, // Renamed from 'nodes'
};
