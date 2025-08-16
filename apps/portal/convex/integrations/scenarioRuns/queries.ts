import { paginationOptsValidator } from "convex/server";
import { query } from "../../_generated/server";
import { v } from "convex/values";

export const getScenarioRunsByScenario = query({
  args: {
    scenarioId: v.id("scenarios"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("scenarioRuns"),
        _creationTime: v.number(),
        scenarioId: v.id("scenarios"),
        scenarioVersion: v.number(),
        status: v.union(
          v.literal("pending"),
          v.literal("running"),
          v.literal("succeeded"),
          v.literal("failed"),
          v.literal("cancelled"),
        ),
        triggerKey: v.string(),
        connectionId: v.optional(v.id("connections")),
        correlationId: v.string(),
        startedAt: v.number(),
        finishedAt: v.optional(v.number()),
      }),
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
    pageStatus: v.optional(v.any()),
    splitCursor: v.optional(v.any()),
  }),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scenarioRuns")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.scenarioId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const getScenarioRunByCorrelation = query({
  args: {
    correlationId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("scenarioRuns"),
      _creationTime: v.number(),
      scenarioId: v.id("scenarios"),
      scenarioVersion: v.number(),
      status: v.union(
        v.literal("pending"),
        v.literal("running"),
        v.literal("succeeded"),
        v.literal("failed"),
        v.literal("cancelled"),
      ),
      triggerKey: v.string(),
      connectionId: v.optional(v.id("connections")),
      correlationId: v.string(),
      startedAt: v.number(),
      finishedAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scenarioRuns")
      .withIndex("by_correlation", (q) =>
        q.eq("correlationId", args.correlationId),
      )
      .unique();
  },
});

export const getScenarioRunsByStatus = query({
  args: {
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("cancelled"),
    ),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("scenarioRuns"),
        _creationTime: v.number(),
        scenarioId: v.id("scenarios"),
        scenarioVersion: v.number(),
        status: v.union(
          v.literal("pending"),
          v.literal("running"),
          v.literal("succeeded"),
          v.literal("failed"),
          v.literal("cancelled"),
        ),
        triggerKey: v.string(),
        connectionId: v.optional(v.id("connections")),
        correlationId: v.string(),
        startedAt: v.number(),
        finishedAt: v.optional(v.number()),
      }),
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
    pageStatus: v.optional(v.any()),
    splitCursor: v.optional(v.any()),
  }),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scenarioRuns")
      .withIndex("by_status_and_time", (q) => q.eq("status", args.status))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

/**
 * Get scenario runs by scenario and version
 * Useful for tracking which runs were executed with specific scenario versions
 */
export const getScenarioRunsByScenarioAndVersion = query({
  args: {
    scenarioId: v.id("scenarios"),
    scenarioVersion: v.number(),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("scenarioRuns"),
        _creationTime: v.number(),
        scenarioId: v.id("scenarios"),
        scenarioVersion: v.number(),
        status: v.union(
          v.literal("pending"),
          v.literal("running"),
          v.literal("succeeded"),
          v.literal("failed"),
          v.literal("cancelled"),
        ),
        triggerKey: v.string(),
        connectionId: v.optional(v.id("connections")),
        correlationId: v.string(),
        startedAt: v.number(),
        finishedAt: v.optional(v.number()),
      }),
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
    pageStatus: v.optional(v.any()),
    splitCursor: v.optional(v.any()),
  }),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scenarioRuns")
      .withIndex("by_scenario_version", (q) =>
        q
          .eq("scenarioId", args.scenarioId)
          .eq("scenarioVersion", args.scenarioVersion),
      )
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
