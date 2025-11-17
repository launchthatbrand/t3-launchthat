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
      // Add versioning fields that exist in the schema
      draftConfig: v.optional(
        v.object({
          triggerKey: v.string(),
          triggerConfig: v.any(),
          enabled: v.optional(v.boolean()),
          schedule: v.optional(v.string()),
          metadata: v.optional(v.any()),
        }),
      ),
      publishedConfig: v.optional(
        v.object({
          triggerKey: v.string(),
          triggerConfig: v.any(),
          enabled: v.optional(v.boolean()),
          schedule: v.optional(v.string()),
          metadata: v.optional(v.any()),
        }),
      ),
      version: v.optional(v.number()),
      enabled: v.optional(v.boolean()),
      uiState: v.optional(
        v.object({
          viewport: v.object({
            x: v.number(),
            y: v.number(),
            zoom: v.number(),
          }),
          selectedNodeIds: v.optional(v.array(v.id("nodes"))),
        }),
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
      // Use composite index for status and owner
      filteredScenarios = await baseQuery
        .withIndex("by_status_and_owner", (q) =>
          q.eq("status", args.status!).eq("ownerId", args.ownerId!),
        )
        .collect();
    } else if (args.status !== undefined && args.scenarioType !== undefined) {
      // Use status index then filter on scenarioType
      filteredScenarios = await baseQuery
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .filter((q) => q.eq(q.field("scenarioType"), args.scenarioType))
        .collect();
    } else if (args.ownerId !== undefined && args.scenarioType !== undefined) {
      // Use owner index then filter on scenarioType
      filteredScenarios = await baseQuery
        .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId!))
        .filter((q) => q.eq(q.field("scenarioType"), args.scenarioType))
        .collect();
    } else if (args.status !== undefined) {
      // Only status provided - use existing index
      filteredScenarios = await baseQuery
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else if (args.ownerId !== undefined) {
      // Only ownerId provided - use existing index
      filteredScenarios = await baseQuery
        .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId!))
        .collect();
    } else if (args.scenarioType !== undefined) {
      // Only scenarioType provided - use new index
      filteredScenarios = await baseQuery
        .withIndex("by_scenario_type", (q) =>
          q.eq("scenarioType", args.scenarioType!),
        )
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
      draftConfig: v.object({
        triggerKey: v.string(),
        triggerConfig: v.any(),
        enabled: v.optional(v.boolean()),
        schedule: v.optional(v.string()),
        metadata: v.optional(v.any()),
      }),
      publishedConfig: v.optional(
        v.object({
          triggerKey: v.string(),
          triggerConfig: v.any(),
          enabled: v.optional(v.boolean()),
          schedule: v.optional(v.string()),
          metadata: v.optional(v.any()),
        }),
      ),
      version: v.number(),
      enabled: v.boolean(),
      slug: v.optional(v.string()),
      scenarioType: v.optional(
        v.union(v.literal("general"), v.literal("checkout")),
      ),
      lastExecutedAt: v.optional(v.number()),
      lastExecutionResult: v.optional(v.string()),
      lastExecutionError: v.optional(v.string()),
      ownerId: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
      uiState: v.optional(
        v.object({
          viewport: v.object({
            x: v.number(),
            y: v.number(),
            zoom: v.number(),
          }),
          selectedNodeIds: v.optional(v.array(v.id("nodes"))),
        }),
      ),
      // DEPRECATED FIELDS (for backward compatibility)
      schedule: v.optional(v.string()),
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
      draftConfig: v.object({
        triggerKey: v.string(),
        triggerConfig: v.any(),
        enabled: v.optional(v.boolean()),
        schedule: v.optional(v.string()),
        metadata: v.optional(v.any()),
      }),
      publishedConfig: v.optional(
        v.object({
          triggerKey: v.string(),
          triggerConfig: v.any(),
          enabled: v.optional(v.boolean()),
          schedule: v.optional(v.string()),
          metadata: v.optional(v.any()),
        }),
      ),
      version: v.number(),
      enabled: v.boolean(),
      slug: v.optional(v.string()),
      scenarioType: v.optional(
        v.union(v.literal("general"), v.literal("checkout")),
      ),
      lastExecutedAt: v.optional(v.number()),
      lastExecutionResult: v.optional(v.string()),
      lastExecutionError: v.optional(v.string()),
      ownerId: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
      uiState: v.optional(
        v.object({
          viewport: v.object({
            x: v.number(),
            y: v.number(),
            zoom: v.number(),
          }),
          selectedNodeIds: v.optional(v.array(v.id("nodes"))),
        }),
      ),
      // DEPRECATED FIELDS (for backward compatibility)
      schedule: v.optional(v.string()),
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
      // Add versioning fields that exist in the schema
      draftConfig: v.optional(
        v.object({
          triggerKey: v.string(),
          triggerConfig: v.any(),
          enabled: v.optional(v.boolean()),
          schedule: v.optional(v.string()),
          metadata: v.optional(v.any()),
        }),
      ),
      publishedConfig: v.optional(
        v.object({
          triggerKey: v.string(),
          triggerConfig: v.any(),
          enabled: v.optional(v.boolean()),
          schedule: v.optional(v.string()),
          metadata: v.optional(v.any()),
        }),
      ),
      version: v.optional(v.number()),
      enabled: v.optional(v.boolean()),
      scenarioType: v.optional(
        v.union(v.literal("general"), v.literal("checkout")),
      ),
      slug: v.optional(v.string()),
      uiState: v.optional(
        v.object({
          viewport: v.object({
            x: v.number(),
            y: v.number(),
            zoom: v.number(),
          }),
          selectedNodeIds: v.optional(v.array(v.id("nodes"))),
        }),
      ),
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
      // Add versioning fields that exist in the schema
      draftConfig: v.optional(
        v.object({
          triggerKey: v.string(),
          triggerConfig: v.any(),
          enabled: v.optional(v.boolean()),
          schedule: v.optional(v.string()),
          metadata: v.optional(v.any()),
        }),
      ),
      publishedConfig: v.optional(
        v.object({
          triggerKey: v.string(),
          triggerConfig: v.any(),
          enabled: v.optional(v.boolean()),
          schedule: v.optional(v.string()),
          metadata: v.optional(v.any()),
        }),
      ),
      version: v.optional(v.number()),
      enabled: v.optional(v.boolean()),
      scenarioType: v.optional(
        v.union(v.literal("general"), v.literal("checkout")),
      ),
      slug: v.optional(v.string()),
      uiState: v.optional(
        v.object({
          viewport: v.object({
            x: v.number(),
            y: v.number(),
            zoom: v.number(),
          }),
          selectedNodeIds: v.optional(v.array(v.id("nodes"))),
        }),
      ),
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

/**
 * Get scenario version information including draft and published configs
 */
export const getVersionInfo = query({
  args: { id: v.id("scenarios") },
  returns: v.union(
    v.object({
      _id: v.id("scenarios"),
      name: v.string(),
      version: v.number(),
      status: v.string(),
      enabled: v.boolean(),
      draftConfig: v.object({
        triggerKey: v.string(),
        triggerConfig: v.any(),
        enabled: v.optional(v.boolean()),
        schedule: v.optional(v.string()),
        metadata: v.optional(v.any()),
      }),
      publishedConfig: v.optional(
        v.object({
          triggerKey: v.string(),
          triggerConfig: v.any(),
          enabled: v.optional(v.boolean()),
          schedule: v.optional(v.string()),
          metadata: v.optional(v.any()),
        }),
      ),
      hasDraftChanges: v.boolean(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const scenario = await ctx.db.get(args.id);
    if (!scenario) {
      return null;
    }

    const hasDraftChanges =
      JSON.stringify(scenario.draftConfig) !==
      JSON.stringify(scenario.publishedConfig);

    return {
      _id: scenario._id,
      name: scenario.name,
      version: scenario.version,
      status: scenario.status,
      enabled: scenario.enabled,
      draftConfig: scenario.draftConfig,
      publishedConfig: scenario.publishedConfig,
      hasDraftChanges,
      updatedAt: scenario.updatedAt,
    };
  },
});

/**
 * List only published scenarios for runtime execution
 */
export const listPublished = query({
  args: {
    enabled: v.optional(v.boolean()),
    triggerKey: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("scenarios"),
      name: v.string(),
      version: v.number(),
      publishedConfig: v.object({
        triggerKey: v.string(),
        triggerConfig: v.any(),
        enabled: v.optional(v.boolean()),
        schedule: v.optional(v.string()),
        metadata: v.optional(v.any()),
      }),
      enabled: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    let scenarios;

    // Get scenarios based on enabled filter
    if (args.enabled !== undefined) {
      scenarios = await ctx.db
        .query("scenarios")
        .withIndex("by_enabled", (q) => q.eq("enabled", args.enabled!))
        .collect();
    } else {
      scenarios = await ctx.db.query("scenarios").collect();
    }

    // Filter for scenarios with published configurations and optionally by trigger
    return scenarios
      .filter((s) => s.publishedConfig != null)
      .filter(
        (s) =>
          !args.triggerKey || s.publishedConfig?.triggerKey === args.triggerKey,
      )
      .map((s) => ({
        _id: s._id,
        name: s.name,
        version: s.version,
        publishedConfig: s.publishedConfig!,
        enabled: s.enabled,
      }));
  },
});

/**
 * Get scenario runs filtered by version
 */
export const getRunsByVersion = query({
  args: {
    scenarioId: v.id("scenarios"),
    version: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("scenarioRuns"),
      scenarioVersion: v.number(),
      status: v.union(
        v.literal("pending"),
        v.literal("running"),
        v.literal("succeeded"),
        v.literal("failed"),
        v.literal("cancelled"),
      ),
      correlationId: v.string(),
      startedAt: v.number(),
      finishedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    if (args.version !== undefined) {
      return await ctx.db
        .query("scenarioRuns")
        .withIndex("by_scenario_version", (q) =>
          q
            .eq("scenarioId", args.scenarioId)
            .eq("scenarioVersion", args.version!),
        )
        .collect();
    }

    return await ctx.db
      .query("scenarioRuns")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.scenarioId))
      .collect();
  },
});

/**
 * Find scenarios by trigger key for webhook processing
 */
export const findByTriggerKey = query({
  args: { triggerKey: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("scenarios"),
      name: v.string(),
      version: v.number(),
      publishedConfig: v.optional(
        v.object({
          triggerKey: v.string(),
          triggerConfig: v.any(),
          enabled: v.optional(v.boolean()),
          schedule: v.optional(v.string()),
          metadata: v.optional(v.any()),
        }),
      ),
      enabled: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    // Get all enabled scenarios with published configs that match the trigger key
    const scenarios = await ctx.db
      .query("scenarios")
      .withIndex("by_enabled", (q) => q.eq("enabled", true))
      .collect();

    return scenarios
      .filter((s) => s.publishedConfig?.triggerKey === args.triggerKey)
      .map((s) => ({
        _id: s._id,
        name: s.name,
        version: s.version,
        publishedConfig: s.publishedConfig!,
        enabled: s.enabled,
      }));
  },
});
