import type { Doc, Id } from "../../_generated/dataModel";

import { mutation } from "../../_generated/server";
import { v } from "convex/values";

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
    // Optional flattened output schema coming from the frontend (JSON string)
    schema: v.optional(v.string()),
    // Optional sample data blob captured during testing (JSON string)
    sampleData: v.optional(v.string()),
  },
  returns: v.id("nodes"),
  handler: async (ctx, args) => {
    // Verify the scenario exists
    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario) {
      throw new Error(`Scenario with ID ${args.scenarioId} not found`);
    }

    // Enforce type constraints for checkout scenarios
    const scenarioType =
      (scenario as unknown as { scenarioType?: string }).scenarioType ??
      "general";
    if (scenarioType === "checkout") {
      const allowedTypes: string[] = [
        "checkout",
        "order_confirmation",
        "upsell",
        "router",
      ];
      if (!allowedTypes.includes(args.type)) {
        throw new Error(
          `Node type '${args.type}' is not allowed in checkout scenarios`,
        );
      }
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
      // Persist schema under the canonical field name if provided
      ...(args.schema ? { outputSchema: args.schema } : {}),
      // Persist sampleData if provided (helpful for future previews)
      ...(args.sampleData ? { sampleData: args.sampleData } : {}),
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

    // Block deletion of system nodes
    if ((node as unknown as { isSystem?: boolean }).isSystem) {
      throw new Error("System nodes cannot be deleted");
    }

    // Enforce required minimums for checkout scenarios
    const scenario = await ctx.db.get(node.scenarioId);
    if (!scenario) {
      throw new Error("Scenario not found");
    }
    const scenarioType =
      (scenario as unknown as { scenarioType?: string }).scenarioType ??
      "general";
    if (scenarioType === "checkout") {
      if (node.type === "checkout" || node.type === "order_confirmation") {
        const sameType = await ctx.db
          .query("nodes")
          .withIndex("by_scenario_and_type", (q) =>
            q.eq("scenarioId", node.scenarioId).eq("type", node.type),
          )
          .collect();
        if (sameType.length <= 1) {
          throw new Error(
            `Cannot delete the last ${node.type} node in a checkout scenario`,
          );
        }
      }
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
    // New optional fields
    label: v.optional(v.string()),
    branch: v.optional(v.string()),
    order: v.optional(v.number()),
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
      label: args.label,
      branch: args.branch,
      order: args.order,
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
    // New optional fields
    label: v.optional(v.string()),
    branch: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  returns: v.id("nodeConnections"),
  handler: async (ctx, args) => {
    const { id, ...rest } = args;

    // Make sure the connection exists
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error(`Connection with ID ${id} not found`);
    }

    const now = Date.now();

    await ctx.db.patch(id, {
      ...(rest.mapping !== undefined ? { mapping: rest.mapping } : {}),
      ...(rest.label !== undefined ? { label: rest.label } : {}),
      ...(rest.branch !== undefined ? { branch: rest.branch } : {}),
      ...(rest.order !== undefined ? { order: rest.order } : {}),
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

/**
 * Update a node's output schema or input mapping (used by builder)
 */
export const updateSchema = mutation({
  args: {
    // Accept either a real database id or a temporary client id string (e.g., "node-<timestamp>")
    id: v.string(),
    outputSchema: v.optional(v.string()),
    inputMapping: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const { id, outputSchema, inputMapping } = args;

    // If the id does not look like a Convex-generated Id (contains "node-") we skip the patch –
    // the frontend will send the schema again when it creates the real node record.
    if (id.startsWith("node-")) {
      return id as unknown as Id<"nodes">;
    }

    // At this point it's a real database id; perform the update
    const dbId = id as Id<"nodes">;
    const existing = await ctx.db.get(dbId);
    if (!existing) {
      // Node may not be persisted yet; ignore and let client retry later
      return dbId;
    }

    await ctx.db.patch(dbId, {
      ...(outputSchema ? { outputSchema } : {}),
      ...(inputMapping ? { inputMapping } : {}),
      updatedAt: Date.now(),
    });

    return dbId;
  },
});
