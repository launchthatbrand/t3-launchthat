import { query } from "@convex-config/_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

export const getScenarioLogsByScenario = query({
  args: {
    scenarioId: v.id("scenarios"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("scenarioLogs"),
        _creationTime: v.number(),
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
    pageStatus: v.optional(v.any()),
    splitCursor: v.optional(v.any()),
  }),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scenarioLogs")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.scenarioId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const getScenarioLogsByRun = query({
  args: {
    runId: v.id("scenarioRuns"),
  },
  returns: v.array(
    v.object({
      _id: v.id("scenarioLogs"),
      _creationTime: v.number(),
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
      .query("scenarioLogs")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .order("asc")
      .collect();
  },
});

export const getAllScenarioLogs = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("scenarioLogs"),
        _creationTime: v.number(),
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
    pageStatus: v.optional(v.any()),
    splitCursor: v.optional(v.any()),
  }),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scenarioLogs")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const getScenarioLogStats = query({
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
    if (args.scenarioId) {
      const scenarioId = args.scenarioId; // narrow for TS
      const logs = await ctx.db
        .query("scenarioLogs")
        .withIndex("by_scenario", (q) => q.eq("scenarioId", scenarioId))
        .collect();

      return computeLogStats(logs);
    }

    const logs = await ctx.db.query("scenarioLogs").collect();
    return computeLogStats(logs);
  },
});

function computeLogStats(
  logs: {
    runId: string;
    status: "running" | "success" | "error" | "skipped" | "cancelled";
    duration?: number;
    _creationTime: number;
  }[],
) {
  const runIds = new Set(logs.map((log) => log.runId));
  const totalRuns = runIds.size;

  const runStats = Array.from(runIds).map((runId) => {
    const runLogs = logs.filter((log) => log.runId === runId);
    const hasErrors = runLogs.some((log) => log.status === "error");
    const isComplete = runLogs.every((log) => log.status !== "running");
    return { runId, hasErrors, isComplete, logs: runLogs } as const;
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
  const failedExecutions = logs.filter((log) => log.status === "error").length;

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
  } as const;
}

export const getScenarioLogById = query({
  args: {
    logId: v.id("scenarioLogs"),
  },
  returns: v.union(
    v.object({
      _id: v.id("scenarioLogs"),
      _creationTime: v.number(),
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
