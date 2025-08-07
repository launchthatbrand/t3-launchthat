import { v } from "convex/values";

import { Id } from "../../_generated/dataModel";
import { query } from "../../_generated/server";

// Define type for node data
interface NodeData {
  _id: Id<"nodes">;
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
