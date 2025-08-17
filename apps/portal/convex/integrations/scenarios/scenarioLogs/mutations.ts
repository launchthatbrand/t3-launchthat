import { mutation } from "@convex-config/_generated/server";
import { v } from "convex/values";

export const createScenarioLogEntry = mutation({
  args: {
    scenarioId: v.id("scenarios"),
    runId: v.id("scenarioRuns"),
    nodeId: v.optional(v.id("nodes")),
    action: v.string(),
    status: v.union(
      v.literal("running"),
      v.literal("success"),
      v.literal("error"),
      v.literal("skipped"),
      v.literal("cancelled"),
    ),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    duration: v.optional(v.number()),
    inputData: v.optional(v.string()),
    outputData: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    metadata: v.optional(v.string()),
    requestInfo: v.optional(
      v.object({
        endpoint: v.string(),
        method: v.string(),
        headers: v.optional(v.any()),
      }),
    ),
    responseInfo: v.optional(
      v.object({
        statusCode: v.number(),
        statusText: v.string(),
        headers: v.optional(v.any()),
      }),
    ),
    userId: v.optional(v.id("users")),
  },
  returns: v.id("scenarioLogs"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("scenarioLogs", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const updateScenarioLogEntry = mutation({
  args: {
    id: v.id("scenarioLogs"),
    status: v.optional(
      v.union(
        v.literal("running"),
        v.literal("success"),
        v.literal("error"),
        v.literal("skipped"),
        v.literal("cancelled"),
      ),
    ),
    endTime: v.optional(v.number()),
    duration: v.optional(v.number()),
    outputData: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    metadata: v.optional(v.string()),
    responseInfo: v.optional(
      v.object({
        statusCode: v.number(),
        statusText: v.string(),
        headers: v.optional(v.any()),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return null;
  },
});

export const logScenarioStart = mutation({
  args: {
    scenarioId: v.id("scenarios"),
    runId: v.id("scenarioRuns"),
    userId: v.optional(v.id("users")),
    metadata: v.optional(v.string()),
  },
  returns: v.id("scenarioLogs"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("scenarioLogs", {
      scenarioId: args.scenarioId,
      runId: args.runId,
      action: "scenario_start",
      status: "running",
      startTime: Date.now(),
      userId: args.userId,
      metadata: args.metadata,
      timestamp: Date.now(),
    });
  },
});

export const logScenarioComplete = mutation({
  args: {
    scenarioId: v.id("scenarios"),
    runId: v.id("scenarioRuns"),
    status: v.union(v.literal("success"), v.literal("error")),
    startTime: v.number(),
    errorMessage: v.optional(v.string()),
    metadata: v.optional(v.string()),
  },
  returns: v.id("scenarioLogs"),
  handler: async (ctx, args) => {
    const endTime = Date.now();
    return await ctx.db.insert("scenarioLogs", {
      scenarioId: args.scenarioId,
      runId: args.runId,
      action: "scenario_complete",
      status: args.status,
      startTime: args.startTime,
      endTime,
      duration: endTime - args.startTime,
      errorMessage: args.errorMessage,
      metadata: args.metadata,
      timestamp: endTime,
    });
  },
});

export const logNodeExecution = mutation({
  args: {
    scenarioId: v.id("scenarios"),
    runId: v.id("scenarioRuns"),
    nodeId: v.id("nodes"),
    action: v.string(),
    status: v.union(
      v.literal("running"),
      v.literal("success"),
      v.literal("error"),
      v.literal("skipped"),
    ),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    inputData: v.optional(v.string()),
    outputData: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    requestInfo: v.optional(
      v.object({
        endpoint: v.string(),
        method: v.string(),
        headers: v.optional(v.any()),
      }),
    ),
    responseInfo: v.optional(
      v.object({
        statusCode: v.number(),
        statusText: v.string(),
        headers: v.optional(v.any()),
      }),
    ),
    metadata: v.optional(v.string()),
  },
  returns: v.id("scenarioLogs"),
  handler: async (ctx, args) => {
    const duration = args.endTime ? args.endTime - args.startTime : undefined;
    return await ctx.db.insert("scenarioLogs", {
      ...args,
      duration,
      timestamp: Date.now(),
    });
  },
});
