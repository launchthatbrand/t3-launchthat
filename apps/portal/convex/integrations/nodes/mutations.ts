import { v } from "convex/values";

import { mutation } from "../../_generated/server";

/**
 * Create a new node in a scenario
 */
export const create = mutation({
  args: {
    scenarioId: v.id("scenarios"),
    type: v.string(),
    label: v.string(),
    config: v.string(),
    position: v.string(),
    order: v.optional(v.number()),
  },
  returns: v.id("nodes"),
  handler: async (ctx, args) => {
    // Verify the scenario exists
    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario) {
      throw new Error(`Scenario with ID ${args.scenarioId} not found`);
    }

    const now = Date.now();

    // Create the node
    return await ctx.db.insert("nodes", {
      scenarioId: args.scenarioId,
      type: args.type,
      label: args.label,
      config: args.config,
      position: args.position,
      order: args.order,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Define an interface for the update fields
interface NodeUpdate {
  label?: string;
  config?: string;
  position?: string;
  order?: number;
  updatedAt: number;
}

/**
 * Update an existing node
 */
export const update = mutation({
  args: {
    id: v.id("nodes"),
    label: v.optional(v.string()),
    config: v.optional(v.string()),
    position: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  returns: v.id("nodes"),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Make sure the node exists
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error(`Node with ID ${id} not found`);
    }

    const now = Date.now();

    // Prepare the update with timestamp
    const updatedFields: NodeUpdate = {
      ...updates,
      updatedAt: now,
    };

    // Patch the document with all fields
    await ctx.db.patch(id, updatedFields);
    return id;
  },
});

/**
 * Delete a node and all its connections
 */
export const remove = mutation({
  args: {
    id: v.id("nodes"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Make sure the node exists
    const node = await ctx.db.get(args.id);
    if (!node) {
      throw new Error(`Node with ID ${args.id} not found`);
    }

    // Get all incoming connections (where this node is the target)
    const incomingConnections = await ctx.db
      .query("nodeConnections")
      .withIndex("by_target", (q) => q.eq("targetNodeId", args.id))
      .collect();

    // Get all outgoing connections (where this node is the source)
    const outgoingConnections = await ctx.db
      .query("nodeConnections")
      .withIndex("by_source", (q) => q.eq("sourceNodeId", args.id))
      .collect();

    // Delete all connections first
    for (const connection of [...incomingConnections, ...outgoingConnections]) {
      await ctx.db.delete(connection._id);
    }

    // Finally, delete the node
    await ctx.db.delete(args.id);

    return true;
  },
});

/**
 * Create a connection between two nodes
 */
export const createConnection = mutation({
  args: {
    scenarioId: v.id("scenarios"),
    sourceNodeId: v.id("nodes"),
    targetNodeId: v.id("nodes"),
    mapping: v.optional(v.string()),
  },
  returns: v.id("nodeConnections"),
  handler: async (ctx, args) => {
    // Verify the scenario exists
    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario) {
      throw new Error(`Scenario with ID ${args.scenarioId} not found`);
    }

    // Verify the source node exists
    const sourceNode = await ctx.db.get(args.sourceNodeId);
    if (!sourceNode) {
      throw new Error(`Source node with ID ${args.sourceNodeId} not found`);
    }

    // Verify the target node exists
    const targetNode = await ctx.db.get(args.targetNodeId);
    if (!targetNode) {
      throw new Error(`Target node with ID ${args.targetNodeId} not found`);
    }

    // Verify both nodes belong to the same scenario
    if (sourceNode.scenarioId !== args.scenarioId) {
      throw new Error(
        `Source node does not belong to scenario ${args.scenarioId}`,
      );
    }
    if (targetNode.scenarioId !== args.scenarioId) {
      throw new Error(
        `Target node does not belong to scenario ${args.scenarioId}`,
      );
    }

    // Check if connection already exists
    const existingConnections = await ctx.db
      .query("nodeConnections")
      .withIndex("by_source_and_target", (q) =>
        q
          .eq("sourceNodeId", args.sourceNodeId)
          .eq("targetNodeId", args.targetNodeId),
      )
      .collect();

    if (existingConnections.length > 0) {
      throw new Error(`Connection between these nodes already exists`);
    }

    const now = Date.now();

    // Create the connection
    return await ctx.db.insert("nodeConnections", {
      scenarioId: args.scenarioId,
      sourceNodeId: args.sourceNodeId,
      targetNodeId: args.targetNodeId,
      mapping: args.mapping,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update an existing connection
 */
export const updateConnection = mutation({
  args: {
    id: v.id("nodeConnections"),
    mapping: v.optional(v.string()),
  },
  returns: v.id("nodeConnections"),
  handler: async (ctx, args) => {
    const { id, mapping } = args;

    // Make sure the connection exists
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error(`Connection with ID ${id} not found`);
    }

    const now = Date.now();

    await ctx.db.patch(id, {
      mapping,
      updatedAt: now,
    });

    return id;
  },
});

/**
 * Delete a connection
 */
export const removeConnection = mutation({
  args: {
    id: v.id("nodeConnections"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Make sure the connection exists
    const connection = await ctx.db.get(args.id);
    if (!connection) {
      throw new Error(`Connection with ID ${args.id} not found`);
    }

    await ctx.db.delete(args.id);

    return true;
  },
});
