import { internalMutation, mutation } from "../../_generated/server";

import { v } from "convex/values";

export const createScenarioRun = mutation({
  args: {
    scenarioId: v.id("scenarios"),
    triggerKey: v.string(),
    correlationId: v.string(),
    connectionId: v.optional(v.id("connections")),
  },
  returns: v.id("scenarioRuns"),
  handler: async (ctx, args) => {
    // Get the scenario to capture its current version
    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${args.scenarioId} not found`);
    }

    const now = Date.now();
    const runId = await ctx.db.insert("scenarioRuns", {
      scenarioId: args.scenarioId,
      scenarioVersion: scenario.version,
      status: "running",
      triggerKey: args.triggerKey,
      correlationId: args.correlationId,
      connectionId: args.connectionId,
      startedAt: now,
    });
    return runId;
  },
});

export const completeScenarioRun = mutation({
  args: {
    runId: v.id("scenarioRuns"),
    status: v.union(
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("cancelled"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const finishedAt = Date.now();
    await ctx.db.patch(args.runId, { status: args.status, finishedAt });
    return null;
  },
});

/**
 * Atomically ensures idempotent execution by checking for existing runs
 * and creating new ones in a single transaction. This prevents race conditions
 * that could occur with separate query + mutation calls.
 */
export const ensureIdempotentRun = internalMutation({
  args: {
    scenarioId: v.id("scenarios"),
    triggerKey: v.string(),
    correlationId: v.string(),
    connectionId: v.optional(v.id("connections")),
  },
  returns: v.object({
    isNew: v.boolean(),
    runId: v.id("scenarioRuns"),
    existingStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("running"),
        v.literal("succeeded"),
        v.literal("failed"),
        v.literal("cancelled"),
      ),
    ),
  }),
  handler: async (ctx, args) => {
    // Check if a run with this correlationId already exists
    const existingRun = await ctx.db
      .query("scenarioRuns")
      .withIndex("by_correlation", (q) =>
        q.eq("correlationId", args.correlationId),
      )
      .first();

    if (existingRun) {
      // Run already exists - return existing to prevent duplicate execution
      return {
        isNew: false,
        runId: existingRun._id,
        existingStatus: existingRun.status,
      };
    }

    // Get the scenario to capture its current version
    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${args.scenarioId} not found`);
    }

    // No existing run found - create a new one atomically
    const now = Date.now();
    const runId = await ctx.db.insert("scenarioRuns", {
      scenarioId: args.scenarioId,
      scenarioVersion: scenario.version,
      status: "running",
      triggerKey: args.triggerKey,
      correlationId: args.correlationId,
      connectionId: args.connectionId,
      startedAt: now,
    });

    return {
      isNew: true,
      runId,
    };
  },
});
