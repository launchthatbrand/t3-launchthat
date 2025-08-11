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
        const updatedFields = {
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
            throw new Error(`Source node does not belong to scenario ${args.scenarioId}`);
        }
        if (targetNode.scenarioId !== args.scenarioId) {
            throw new Error(`Target node does not belong to scenario ${args.scenarioId}`);
        }
        // Check if connection already exists
        const existingConnections = await ctx.db
            .query("nodeConnections")
            .withIndex("by_source_and_target", (q) => q
            .eq("sourceNodeId", args.sourceNodeId)
            .eq("targetNodeId", args.targetNodeId))
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
            return id;
        }
        // At this point it's a real database id; perform the update
        const dbId = id;
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
