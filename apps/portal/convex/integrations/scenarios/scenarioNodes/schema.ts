import { defineTable } from "convex/server";
import { v } from "convex/values";

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
 * Schema definition for the Node Connections table
 *
 * This table stores connections between scenario nodes.
 * Each connection represents a data flow from one node to another.
 */
export const scenarioNodeConnectionsTable = defineTable({
  // Reference to the scenario this connection belongs to
  scenarioId: v.id("scenarios"),

  // Source scenario node ID
  sourceNodeId: v.id("scenarioNodes"),

  // Target scenario node ID
  targetNodeId: v.id("scenarioNodes"),

  // JSON mapping configuration between source and target fields
  mapping: v.optional(v.string()),

  // Optional display label for this connection
  label: v.optional(v.string()),

  // Optional branch key (e.g., default | accept | decline)
  branch: v.optional(v.string()),

  // Optional ordering index among sibling connections
  order: v.optional(v.number()),

  // Creation timestamp
  createdAt: v.number(),

  // Last update timestamp
  updatedAt: v.number(),
})
  // Index for looking up connections by scenario
  .index("by_scenario", ["scenarioId"])
  // Index for looking up connections by source node
  .index("by_source", ["sourceNodeId"])
  // Index for looking up connections by target node
  .index("by_target", ["targetNodeId"])
  // Index for looking up the specific connection between two nodes
  .index("by_source_and_target", ["sourceNodeId", "targetNodeId"]);

/**
 * Schema definition for the Scenario Edges table (React Flow Integration)
 *
 * This table stores React Flow edges for visual scenario editing.
 * It's separate from nodeConnections which handles runtime logic.
 */
export const scenarioEdgesTable = defineTable({
  // Reference to the scenario this edge belongs to
  scenarioId: v.id("scenarios"),

  // Source scenario node ID
  sourceNodeId: v.id("scenarioNodes"),

  // Source handle (for React Flow multi-handle support)
  sourceHandle: v.optional(v.string()),

  // Target scenario node ID
  targetNodeId: v.id("scenarioNodes"),

  // Target handle (for React Flow multi-handle support)
  targetHandle: v.optional(v.string()),

  // Optional display label for this edge
  label: v.optional(v.string()),

  // Whether the edge should be animated
  animated: v.optional(v.boolean()),

  // Edge styling (JSON object for React Flow style)
  style: v.optional(v.string()),

  // Optional ordering index among sibling edges
  order: v.optional(v.number()),

  // Creation timestamp
  createdAt: v.number(),

  // Last update timestamp
  updatedAt: v.number(),
})
  // Index for looking up edges by scenario
  .index("by_scenario", ["scenarioId"])
  // Index for looking up edges by source node
  .index("by_source", ["sourceNodeId"])
  // Index for looking up edges by target node
  .index("by_target", ["targetNodeId"])
  // Index for looking up the specific edge between two nodes
  .index("by_source_and_target", ["sourceNodeId", "targetNodeId"]);

export const integrationsScenarioNodesSchema = {
  scenarioNodes: scenarioNodesTable,
  scenarioNodeConnections: scenarioNodeConnectionsTable,
  scenarioEdges: scenarioEdgesTable,
};
