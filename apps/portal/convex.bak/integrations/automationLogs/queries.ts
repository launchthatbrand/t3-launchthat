import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { query } from "../../_generated/server";

/**
 * Get automation logs for a specific scenario with pagination
 */
export const getAutomationLogsByScenario = query({
  args: {
    scenarioId: v.id("scenarios"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("automationLogs"),
        _creationTime: v.number(),
        scenarioId: v.id("scenarios"),
        runId: v.string(),
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
        timestamp: v.number(),
        userId: v.optional(v.id("users")),
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
      }),
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
    // Add the extra fields that Convex paginate returns
    pageStatus: v.optional(v.any()),
    splitCursor: v.optional(v.any()),
  }),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("automationLogs")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.scenarioId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

/**
 * Get automation logs for a specific run
 */
export const getAutomationLogsByRun = query({
  args: {
    runId: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("automationLogs"),
      _creationTime: v.number(),
      scenarioId: v.id("scenarios"),
      runId: v.string(),
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
      timestamp: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("automationLogs")
      .withIndex("by_run_id", (q) => q.eq("runId", args.runId))
      .order("asc") // Show in chronological order for a specific run
      .collect();
  },
});

/**
 * Get all automation logs with pagination
 */
export const getAllAutomationLogs = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("automationLogs"),
        _creationTime: v.number(),
        scenarioId: v.id("scenarios"),
        runId: v.string(),
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
        timestamp: v.number(),
        userId: v.optional(v.id("users")),
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
      }),
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
    // Add the extra fields that Convex paginate returns
    pageStatus: v.optional(v.any()),
    splitCursor: v.optional(v.any()),
  }),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("automationLogs")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

/**
 * Get automation log statistics for a scenario
 */
export const getAutomationLogStats = query({
  args: {
    scenarioId: v.optional(v.id("scenarios")),
  },
  returns: v.object({
    totalRuns: v.number(),
    successfulRuns: v.number(),
    failedRuns: v.number(),
    totalExecutions: v.number(),
    successfulExecutions: v.number(),
    failedExecutions: v.number(),
    averageDuration: v.optional(v.number()),
    lastRunTime: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    let logs;

    if (args.scenarioId) {
      const scenarioId = args.scenarioId as Id<"scenarios">;
      logs = await ctx.db
        .query("automationLogs")
        .withIndex("by_scenario", (q) => q.eq("scenarioId", scenarioId))
        .collect();
    } else {
      logs = await ctx.db.query("automationLogs").collect();
    }

    // Calculate statistics
    const runIds = new Set(logs.map((log) => log.runId));
    const totalRuns = runIds.size;

    const runStats = Array.from(runIds).map((runId) => {
      const runLogs = logs.filter((log) => log.runId === runId);
      const hasErrors = runLogs.some((log) => log.status === "error");
      const isComplete = runLogs.every((log) => log.status !== "running");
      return { runId, hasErrors, isComplete, logs: runLogs };
    });

    const successfulRuns = runStats.filter(
      (run) => run.isComplete && !run.hasErrors,
    ).length;

    const failedRuns = runStats.filter(
      (run) => run.isComplete && run.hasErrors,
    ).length;

    const totalExecutions = logs.length;
    const successfulExecutions = logs.filter(
      (log) => log.status === "success",
    ).length;
    const failedExecutions = logs.filter(
      (log) => log.status === "error",
    ).length;

    // Calculate average duration for completed logs with duration
    const completedLogsWithDuration = logs.filter(
      (log) => log.duration !== undefined && log.duration > 0,
    );
    const averageDuration =
      completedLogsWithDuration.length > 0
        ? completedLogsWithDuration.reduce(
            (sum, log) => sum + (log.duration ?? 0),
            0,
          ) / completedLogsWithDuration.length
        : undefined;

    // Get the most recent log timestamp
    const lastRunTime =
      logs.length > 0
        ? Math.max(...logs.map((log) => log._creationTime))
        : undefined;

    return {
      totalRuns,
      successfulRuns,
      failedRuns,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      averageDuration,
      lastRunTime,
    };
  },
});

/**
 * Get a specific automation log by ID
 */
export const getAutomationLogById = query({
  args: {
    logId: v.id("automationLogs"),
  },
  returns: v.union(
    v.object({
      _id: v.id("automationLogs"),
      _creationTime: v.number(),
      scenarioId: v.id("scenarios"),
      runId: v.string(),
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
      timestamp: v.number(),
      userId: v.optional(v.id("users")),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.logId);
  },
});
