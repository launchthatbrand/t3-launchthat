import { v } from "convex/values";

import { query } from "../../_generated/server";

/**
 * List all scenarios, optionally filtered by status or owner
 */
export const list = query({
  args: {
    status: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
    // New: optional filter by scenario type
    scenarioType: v.optional(
      v.union(v.literal("general"), v.literal("checkout")),
    ),
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
      // Include optional fields used by specialized UIs
      slug: v.optional(v.string()),
      scenarioType: v.optional(
        v.union(v.literal("general"), v.literal("checkout")),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    // Start with a base query
    const baseQuery = ctx.db.query("scenarios");

    // Apply filters based on provided arguments
    let filteredScenarios;

    if (
      args.status !== undefined &&
      args.ownerId !== undefined &&
      args.scenarioType !== undefined
    ) {
      filteredScenarios = await baseQuery
        .filter((q) =>
          q.and(
            q.eq(q.field("status"), args.status),
            q.eq(q.field("ownerId"), args.ownerId),
            q.eq(q.field("scenarioType"), args.scenarioType),
          ),
        )
        .collect();
    } else if (args.status !== undefined && args.ownerId !== undefined) {
      filteredScenarios = await baseQuery
        .filter((q) =>
          q.and(
            q.eq(q.field("status"), args.status),
            q.eq(q.field("ownerId"), args.ownerId),
          ),
        )
        .collect();
    } else if (args.status !== undefined && args.scenarioType !== undefined) {
      filteredScenarios = await baseQuery
        .filter((q) =>
          q.and(
            q.eq(q.field("status"), args.status),
            q.eq(q.field("scenarioType"), args.scenarioType),
          ),
        )
        .collect();
    } else if (args.ownerId !== undefined && args.scenarioType !== undefined) {
      filteredScenarios = await baseQuery
        .filter((q) =>
          q.and(
            q.eq(q.field("ownerId"), args.ownerId),
            q.eq(q.field("scenarioType"), args.scenarioType),
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
    } else if (args.scenarioType !== undefined) {
      // Only scenarioType provided
      filteredScenarios = await baseQuery
        .filter((q) => q.eq(q.field("scenarioType"), args.scenarioType))
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
    const scenario = await ctx.db.get(args.id);
    return scenario ?? null;
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

    const srec = scenario as unknown as Record<string, unknown>;
    const normalizedScenario = {
      ...scenario,
      description: typeof srec.description === "string" ? srec.description : "",
      status: typeof srec.status === "string" ? srec.status : "draft",
      createdAt:
        typeof srec.createdAt === "number"
          ? srec.createdAt
          : scenario._creationTime,
      updatedAt:
        typeof srec.updatedAt === "number"
          ? srec.updatedAt
          : scenario._creationTime,
    } as typeof scenario & {
      createdAt: number;
      updatedAt: number;
      description: string;
      status: string;
    };

    const normalizedNodes = nodes.map((n) => {
      const nrec = n as unknown as Record<string, unknown>;
      return {
        ...n,
        config:
          typeof nrec.config === "string"
            ? nrec.config
            : JSON.stringify(nrec.config ?? {}),
        position:
          typeof nrec.position === "string"
            ? nrec.position
            : JSON.stringify(
                nrec.position ?? {
                  x: 0,
                  y: 0,
                },
              ),
        createdAt:
          typeof nrec.createdAt === "number" ? nrec.createdAt : n._creationTime,
        updatedAt:
          typeof nrec.updatedAt === "number" ? nrec.updatedAt : n._creationTime,
      };
    });

    const normalizedConnections = connections.map((c) => {
      const crec = c as unknown as Record<string, unknown>;
      return {
        ...c,
        mapping:
          typeof crec.mapping === "string" || crec.mapping === undefined
            ? crec.mapping
            : JSON.stringify(crec.mapping),
        createdAt:
          typeof crec.createdAt === "number" ? crec.createdAt : c._creationTime,
        updatedAt:
          typeof crec.updatedAt === "number" ? crec.updatedAt : c._creationTime,
      };
    });

    return {
      ...normalizedScenario,
      nodes: normalizedNodes.map((n) => ({
        _id: n._id,
        _creationTime: n._creationTime,
        scenarioId: n.scenarioId,
        type: n.type,
        label: n.label,
        config: n.config,
        position: n.position,
        order: n.order,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      })),
      connections: normalizedConnections.map((c) => ({
        _id: c._id,
        _creationTime: c._creationTime,
        scenarioId: c.scenarioId,
        sourceNodeId: c.sourceNodeId,
        targetNodeId: c.targetNodeId,
        mapping: c.mapping,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    };
  },
});

/**
 * Get all scenarios (for admin/global views)
 */
export const getAllScenarios = query({
  args: {},
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
  handler: async (ctx) => {
    return await ctx.db.query("scenarios").collect();
  },
});

/**
 * Get a scenario by slug (primarily for checkout scenarios)
 */
export const getBySlug = query({
  args: {
    slug: v.string(),
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
    const scenario = await ctx.db
      .query("scenarios")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    return scenario ?? null;
  },
});
