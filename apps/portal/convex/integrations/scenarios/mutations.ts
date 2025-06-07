import { v } from "convex/values";

import { mutation } from "../../_generated/server";

/**
 * Create a new integration scenario
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    ownerId: v.id("users"),
    status: v.optional(v.string()),
    schedule: v.optional(v.string()),
  },
  returns: v.id("scenarios"),
  handler: async (ctx, args) => {
    // Verify the owner exists
    const owner = await ctx.db.get(args.ownerId);
    if (!owner) {
      throw new Error(`User with ID ${args.ownerId} not found`);
    }

    const now = Date.now();

    return await ctx.db.insert("scenarios", {
      name: args.name,
      description: args.description,
      status: args.status ?? "draft",
      schedule: args.schedule,
      ownerId: args.ownerId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Define an interface for the update fields
interface ScenarioUpdate {
  name?: string;
  description?: string;
  status?: string;
  schedule?: string;
  updatedAt: number;
}

/**
 * Update an existing scenario
 */
export const update = mutation({
  args: {
    id: v.id("scenarios"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    schedule: v.optional(v.string()),
  },
  returns: v.id("scenarios"),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Make sure the scenario exists
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error(`Scenario with ID ${id} not found`);
    }

    const now = Date.now();

    // Prepare the update with timestamp
    const updatedFields: ScenarioUpdate = {
      ...updates,
      updatedAt: now,
    };

    // Patch the document with all fields
    await ctx.db.patch(id, updatedFields);
    return id;
  },
});

/**
 * Delete a scenario and all its nodes and connections
 */
export const remove = mutation({
  args: {
    id: v.id("scenarios"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Make sure the scenario exists
    const scenario = await ctx.db.get(args.id);
    if (!scenario) {
      throw new Error(`Scenario with ID ${args.id} not found`);
    }

    // Get all nodes for this scenario
    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.id))
      .collect();

    // Get all connections for this scenario
    const connections = await ctx.db
      .query("nodeConnections")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.id))
      .collect();

    // Delete all connections first (to maintain referential integrity)
    for (const connection of connections) {
      await ctx.db.delete(connection._id);
    }

    // Delete all nodes
    for (const node of nodes) {
      await ctx.db.delete(node._id);
    }

    // Finally, delete the scenario
    await ctx.db.delete(args.id);

    return true;
  },
});

/**
 * Execute a scenario
 */
export const execute = mutation({
  args: {
    id: v.id("scenarios"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Make sure the scenario exists
    const scenario = await ctx.db.get(args.id);
    if (!scenario) {
      throw new Error(`Scenario with ID ${args.id} not found`);
    }

    // In a real implementation, this would execute the scenario
    // For now, we'll just simulate a successful execution
    const now = Date.now();

    // Update the scenario execution status
    await ctx.db.patch(args.id, {
      lastExecutedAt: now,
      lastExecutionResult: "success",
      lastExecutionError: undefined,
      updatedAt: now,
    });

    return {
      success: true,
      message: "Scenario executed successfully",
    };
  },
});

/**
 * Update just the status of a scenario
 */
export const updateStatus = mutation({
  args: {
    id: v.id("scenarios"),
    status: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Make sure the scenario exists
    const scenario = await ctx.db.get(args.id);
    if (!scenario) {
      throw new Error(`Scenario with ID ${args.id} not found`);
    }

    const now = Date.now();

    // Update the scenario status
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: now,
    });

    return {
      success: true,
      message: `Scenario status updated to ${args.status}`,
    };
  },
});
