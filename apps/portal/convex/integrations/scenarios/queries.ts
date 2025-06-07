import { v } from "convex/values";

import { query } from "../../_generated/server";

/**
 * List all scenarios, optionally filtered by status or owner
 */
export const list = query({
  args: {
    status: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
  },
  returns: v.array(
    v.object({
      _id: v.id("scenarios"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.string(),
      status: v.string(),
      schedule: v.optional(v.string()),
      lastExecutedAt: v.optional(v.number()),
      lastExecutionResult: v.optional(v.string()),
      lastExecutionError: v.optional(v.string()),
      ownerId: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    // Start with a base query
    const baseQuery = ctx.db.query("scenarios");

    // Apply filters based on provided arguments
    let filteredScenarios;

    if (args.status !== undefined && args.ownerId !== undefined) {
      // Both status and ownerId provided
      filteredScenarios = await baseQuery
        .filter((q) =>
          q.and(
            q.eq(q.field("status"), args.status),
            q.eq(q.field("ownerId"), args.ownerId),
          ),
        )
        .collect();
    } else if (args.status !== undefined) {
      // Only status provided
      filteredScenarios = await baseQuery
        .filter((q) => q.eq(q.field("status"), args.status))
        .collect();
    } else if (args.ownerId !== undefined) {
      // Only ownerId provided
      filteredScenarios = await baseQuery
        .filter((q) => q.eq(q.field("ownerId"), args.ownerId))
        .collect();
    } else {
      // No filters provided
      filteredScenarios = await baseQuery.collect();
    }

    return filteredScenarios;
  },
});

/**
 * Get a specific scenario by ID without nodes and connections
 */
export const getById = query({
  args: {
    id: v.id("scenarios"),
  },
  returns: v.union(
    v.object({
      _id: v.id("scenarios"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.string(),
      status: v.string(),
      schedule: v.optional(v.string()),
      lastExecutedAt: v.optional(v.number()),
      lastExecutionResult: v.optional(v.string()),
      lastExecutionError: v.optional(v.string()),
      ownerId: v.id("users"),
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
 * Get a specific scenario by ID
 */
export const get = query({
  args: {
    id: v.id("scenarios"),
  },
  returns: v.union(
    v.object({
      _id: v.id("scenarios"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.string(),
      status: v.string(),
      schedule: v.optional(v.string()),
      lastExecutedAt: v.optional(v.number()),
      lastExecutionResult: v.optional(v.string()),
      lastExecutionError: v.optional(v.string()),
      ownerId: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
      nodes: v.array(
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
        }),
      ),
      connections: v.array(
        v.object({
          _id: v.id("nodeConnections"),
          _creationTime: v.number(),
          scenarioId: v.id("scenarios"),
          sourceNodeId: v.id("nodes"),
          targetNodeId: v.id("nodes"),
          mapping: v.optional(v.string()),
          createdAt: v.number(),
          updatedAt: v.number(),
        }),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const scenario = await ctx.db.get(args.id);

    if (!scenario) {
      return null;
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

    return {
      ...scenario,
      nodes,
      connections,
    };
  },
});
