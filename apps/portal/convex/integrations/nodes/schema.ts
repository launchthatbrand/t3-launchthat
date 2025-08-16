import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Schema definition for the Nodes table
 *
 * This table stores individual nodes in automation scenarios.
 * Each node represents a specific step in the automation flow
 * with its own type, configuration, and position.
 */
export const nodesTable = defineTable({
  // Reference to the scenario this node belongs to
  scenarioId: v.id("scenarios"),

  // Type of node (e.g., "wordpress_source", "convex_target", "transform")
  type: v.string(),

  // Node label/name for display
  label: v.string(),

  // JSON configuration for this node
  config: v.string(),

  // Optional JSON describing the fields emitted by this node when it runs
  // (array of { field, path, type })
  outputSchema: v.optional(v.string()),

  // Optional JSON template mapping of this node's expected inputs
  // (key -> template string e.g. "{{prevNode.title}}")
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
  // React Flow node type (maps to component type)
  rfType: v.optional(v.string()),

  // React Flow position object with x, y coordinates
  rfPosition: v.optional(
    v.object({
      x: v.number(),
      y: v.number(),
    }),
  ),

  // Optional display label separate from internal name
  rfLabel: v.optional(v.string()),

  // Optional layout dimensions for React Flow
  rfWidth: v.optional(v.number()),
  rfHeight: v.optional(v.number()),

  // Creation timestamp
  createdAt: v.number(),

  // Last update timestamp
  updatedAt: v.number(),
})
  // Index for looking up nodes by scenario
  .index("by_scenario", ["scenarioId"])
  // Index for looking up nodes by type
  .index("by_type", ["type"])
  // Index for looking up nodes by scenario and type
  .index("by_scenario_and_type", ["scenarioId", "type"])
  // Index for looking up nodes by scenario and order
  .index("by_scenario_and_order", ["scenarioId", "order"]);

/**
 * Schema definition for the Node Connections table
 *
 * This table stores connections between nodes in scenarios.
 * Each connection represents a data flow from one node to another
 * with an optional mapping configuration.
 */
export const nodeConnectionsTable = defineTable({
  // Reference to the scenario this connection belongs to
  scenarioId: v.id("scenarios"),

  // Source node ID
  sourceNodeId: v.id("nodes"),

  // Target node ID
  targetNodeId: v.id("nodes"),

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

  // Source node ID
  sourceNodeId: v.id("nodes"),

  // Source handle (for React Flow multi-handle support)
  sourceHandle: v.optional(v.string()),

  // Target node ID
  targetNodeId: v.id("nodes"),

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

/**
 * Export the nodes schemas
 */
export const integrationsNodesSchema = {
  nodes: nodesTable,
  nodeConnections: nodeConnectionsTable,
  scenarioEdges: scenarioEdgesTable,
};
