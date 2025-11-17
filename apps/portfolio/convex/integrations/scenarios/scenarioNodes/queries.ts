import { v } from "convex/values";

import type { Id } from "../../../_generated/dataModel";
import { query } from "../../../_generated/server";

// Define type for node data
interface NodeData {
  _id: Id<"scenarioNodes">;
  type: string;
  label: string;
}

/**
 * List all nodes for a scenario
 */
export const list = query({
  args: {
    scenarioId: v.id("scenarios"),
  },
  returns: v.array(
    v.object({
      _id: v.id("nodes"),
      _creationTime: v.number(),
      scenarioId: v.id("scenarios"),
      type: v.string(),
      label: v.string(),
      config: v.string(),
      position: v.string(),
      order: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
      outputSchema: v.optional(v.string()),
      inputMapping: v.optional(v.string()),
      sampleData: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    // Verify the scenario exists
    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario) {
      throw new Error(`Scenario with ID ${args.scenarioId} not found`);
    }

    // Get all nodes for this scenario
    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.scenarioId))
      .collect();

    return nodes;
  },
});

/**
 * List all nodes for a scenario
 * An alias of the 'list' function for better semantic naming
 */
export const listByScenario = query({
  args: {
    scenarioId: v.id("scenarios"),
  },
  returns: v.array(
    v.object({
      _id: v.id("nodes"),
      _creationTime: v.number(),
      scenarioId: v.id("scenarios"),
      type: v.string(),
      label: v.string(),
      config: v.string(),
      position: v.string(),
      order: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
      outputSchema: v.optional(v.string()),
      inputMapping: v.optional(v.string()),
      sampleData: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    // Verify the scenario exists
    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario) {
      throw new Error(`Scenario with ID ${args.scenarioId} not found`);
    }

    // Get all nodes for this scenario
    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.scenarioId))
      .collect();

    return nodes;
  },
});

/**
 * Get a specific node by ID
 */
export const get = query({
  args: {
    id: v.id("nodes"),
  },
  returns: v.union(
    v.object({
      _id: v.id("nodes"),
      _creationTime: v.number(),
      scenarioId: v.id("scenarios"),
      type: v.string(),
      label: v.string(),
      config: v.string(),
      position: v.string(),
      order: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
      outputSchema: v.optional(v.string()),
      inputMapping: v.optional(v.string()),
      sampleData: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get all connections for a node
 */
export const getConnections = query({
  args: {
    nodeId: v.id("nodes"),
  },
  returns: v.object({
    incoming: v.array(
      v.object({
        _id: v.id("nodeConnections"),
        _creationTime: v.number(),
        scenarioId: v.id("scenarios"),
        sourceNodeId: v.id("nodes"),
        targetNodeId: v.id("nodes"),
        mapping: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
        sourceNode: v.object({
          _id: v.id("nodes"),
          type: v.string(),
          label: v.string(),
        }),
      }),
    ),
    outgoing: v.array(
      v.object({
        _id: v.id("nodeConnections"),
        _creationTime: v.number(),
        scenarioId: v.id("scenarios"),
        sourceNodeId: v.id("nodes"),
        targetNodeId: v.id("nodes"),
        mapping: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
        targetNode: v.object({
          _id: v.id("nodes"),
          type: v.string(),
          label: v.string(),
        }),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    // Verify the node exists
    const node = await ctx.db.get(args.nodeId);
    if (!node) {
      throw new Error(`Node with ID ${args.nodeId} not found`);
    }

    // Get all incoming connections (where this node is the target)
    const incomingConnections = await ctx.db
      .query("nodeConnections")
      .withIndex("by_target", (q) => q.eq("targetNodeId", args.nodeId))
      .collect();

    // Get all outgoing connections (where this node is the source)
    const outgoingConnections = await ctx.db
      .query("nodeConnections")
      .withIndex("by_source", (q) => q.eq("sourceNodeId", args.nodeId))
      .collect();

    // Get details for all connected nodes
    const sourceNodeIds = incomingConnections.map((conn) => conn.sourceNodeId);
    const targetNodeIds = outgoingConnections.map((conn) => conn.targetNodeId);

    const sourceNodes = await Promise.all(
      sourceNodeIds.map((id) => ctx.db.get(id)),
    );

    const targetNodes = await Promise.all(
      targetNodeIds.map((id) => ctx.db.get(id)),
    );

    // Create lookup maps for quick access
    const sourceNodeMap = new Map<Id<"nodes">, NodeData>();
    sourceNodes.forEach((node) => {
      if (node) {
        sourceNodeMap.set(node._id, {
          _id: node._id,
          type: node.type,
          label: node.label,
        });
      }
    });

    const targetNodeMap = new Map<Id<"nodes">, NodeData>();
    targetNodes.forEach((node) => {
      if (node) {
        targetNodeMap.set(node._id, {
          _id: node._id,
          type: node.type,
          label: node.label,
        });
      }
    });

    // Enrich connections with node data
    const enrichedIncoming = incomingConnections.map((conn) => ({
      ...conn,
      sourceNode: sourceNodeMap.get(conn.sourceNodeId) ?? {
        _id: conn.sourceNodeId,
        type: "unknown",
        label: "Unknown",
      },
    }));

    const enrichedOutgoing = outgoingConnections.map((conn) => ({
      ...conn,
      targetNode: targetNodeMap.get(conn.targetNodeId) ?? {
        _id: conn.targetNodeId,
        type: "unknown",
        label: "Unknown",
      },
    }));

    return {
      incoming: enrichedIncoming,
      outgoing: enrichedOutgoing,
    };
  },
});

/**
 * Get all nodes (for admin/global views)
 */
export const getAllNodes = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("nodes"),
      _creationTime: v.number(),
      scenarioId: v.id("scenarios"),
      type: v.string(),
      label: v.string(),
      config: v.string(),
      position: v.string(),
      order: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
      outputSchema: v.optional(v.string()),
      inputMapping: v.optional(v.string()),
      sampleData: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db.query("nodes").collect();
  },
});

/**
 * Alias for listByScenario with a more descriptive name
 */
export const getByScenarioId = listByScenario;

/**
 * Get all node connections for a scenario
 */
export const getConnectionsByScenario = query({
  args: {
    scenarioId: v.id("scenarios"),
  },
  returns: v.array(
    v.object({
      _id: v.id("nodeConnections"),
      _creationTime: v.number(),
      scenarioId: v.id("scenarios"),
      sourceNodeId: v.id("nodes"),
      targetNodeId: v.id("nodes"),
      mapping: v.optional(v.string()),
      label: v.optional(v.string()),
      branch: v.optional(v.string()),
      order: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    // Verify the scenario exists
    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario) {
      throw new Error(`Scenario with ID ${args.scenarioId} not found`);
    }

    // Get all connections for this scenario
    const connections = await ctx.db
      .query("nodeConnections")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.scenarioId))
      .collect();

    return connections;
  },
});

/**
 * Get all scenario edges for a scenario (React Flow integration)
 */
export const getScenarioEdgesByScenario = query({
  args: {
    scenarioId: v.id("scenarios"),
  },
  returns: v.array(
    v.object({
      _id: v.id("scenarioEdges"),
      _creationTime: v.number(),
      scenarioId: v.id("scenarios"),
      sourceNodeId: v.id("nodes"),
      sourceHandle: v.optional(v.string()),
      targetNodeId: v.id("nodes"),
      targetHandle: v.optional(v.string()),
      label: v.optional(v.string()),
      animated: v.optional(v.boolean()),
      style: v.optional(v.string()),
      order: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    // Verify the scenario exists
    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario) {
      throw new Error(`Scenario with ID ${args.scenarioId} not found`);
    }

    // Get all scenario edges for this scenario
    const edges = await ctx.db
      .query("scenarioEdges")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.scenarioId))
      .collect();

    return edges;
  },
});

/**
 * List all available integration nodes
 */
export const listIntegrationNodes = query({
  args: {
    integrationType: v.optional(v.string()),
    category: v.optional(v.string()),
    deprecated: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("integrationNodes"),
      _creationTime: v.number(),
      identifier: v.string(),
      name: v.string(),
      category: v.string(),
      integrationType: v.string(),
      description: v.string(),
      version: v.string(),
      deprecated: v.optional(v.boolean()),
      tags: v.optional(v.array(v.string())),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    let query = ctx.db.query("integrationNodes");

    if (args.integrationType) {
      query = query.withIndex("by_integration_type", (q) =>
        q.eq("integrationType", args.integrationType),
      );
    } else if (args.category) {
      query = query.withIndex("by_category", (q) =>
        q.eq("category", args.category),
      );
    }

    const results = await query.collect();

    // Filter by deprecated status if specified
    const filtered =
      args.deprecated !== undefined
        ? results.filter((node) => !!node.deprecated === args.deprecated)
        : results;

    // Return without sensitive fields (schemas, config)
    return filtered.map((node) => ({
      _id: node._id,
      _creationTime: node._creationTime,
      identifier: node.identifier,
      name: node.name,
      category: node.category,
      integrationType: node.integrationType,
      description: node.description,
      version: node.version,
      deprecated: node.deprecated,
      tags: node.tags,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
    }));
  },
});

/**
 * Get a specific integration node with full details
 */
export const getIntegrationNode = query({
  args: {
    id: v.id("integrationNodes"),
  },
  returns: v.union(
    v.object({
      _id: v.id("integrationNodes"),
      _creationTime: v.number(),
      identifier: v.string(),
      name: v.string(),
      category: v.string(),
      integrationType: v.string(),
      description: v.string(),
      inputSchema: v.string(),
      outputSchema: v.string(),
      configSchema: v.string(),
      uiConfig: v.optional(v.string()),
      version: v.string(),
      deprecated: v.optional(v.boolean()),
      tags: v.optional(v.array(v.string())),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get integration node by identifier
 */
export const getIntegrationNodeByIdentifier = query({
  args: {
    identifier: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("integrationNodes"),
      _creationTime: v.number(),
      identifier: v.string(),
      name: v.string(),
      category: v.string(),
      integrationType: v.string(),
      description: v.string(),
      inputSchema: v.string(),
      outputSchema: v.string(),
      configSchema: v.string(),
      uiConfig: v.optional(v.string()),
      version: v.string(),
      deprecated: v.optional(v.boolean()),
      tags: v.optional(v.array(v.string())),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("integrationNodes")
      .withIndex("by_identifier", (q) => q.eq("identifier", args.identifier))
      .first();
  },
});

/**
 * List scenario nodes for a specific scenario
 */
export const listScenarioNodes = query({
  args: {
    scenarioId: v.id("scenarios"),
  },
  returns: v.array(
    v.object({
      _id: v.id("scenarioNodes"),
      _creationTime: v.number(),
      scenarioId: v.id("scenarios"),
      integrationNodeId: v.id("integrationNodes"),
      label: v.string(),
      connectionId: v.optional(v.id("connections")),
      config: v.any(),
      position: v.string(),
      order: v.optional(v.number()),
      isSystem: v.optional(v.boolean()),
      createdAt: v.number(),
      updatedAt: v.number(),
      // Include integration node details
      integrationNode: v.object({
        identifier: v.string(),
        name: v.string(),
        category: v.string(),
        integrationType: v.string(),
        description: v.string(),
      }),
    }),
  ),
  handler: async (ctx, args) => {
    const scenarioNodes = await ctx.db
      .query("scenarioNodes")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.scenarioId))
      .collect();

    // Enrich with integration node details
    const enriched = await Promise.all(
      scenarioNodes.map(async (node) => {
        const integrationNode = await ctx.db.get(node.integrationNodeId);
        return {
          ...node,
          integrationNode: integrationNode
            ? {
                identifier: integrationNode.identifier,
                name: integrationNode.name,
                category: integrationNode.category,
                integrationType: integrationNode.integrationType,
                description: integrationNode.description,
              }
            : {
                identifier: "unknown",
                name: "Unknown Node",
                category: "unknown",
                integrationType: "unknown",
                description: "Node definition not found",
              },
        };
      }),
    );

    return enriched;
  },
});
