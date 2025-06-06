/**
 * Performance monitoring utilities for scenario execution
 *
 * This file contains functions to help identify performance bottlenecks
 * and optimize scenario execution.
 */

import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";
import { action, mutation, query } from "../../_generated/server";
import { getOptionalUserId } from "../lib/auth";

/**
 * Execution performance metrics structure
 */
interface ExecutionMetrics {
  totalDuration: number;
  nodeMetrics: {
    nodeId: Id<"nodes">;
    type: string;
    startTime: number;
    endTime: number;
    duration: number;
    preparationTime: number;
    executionTime: number;
    recordingTime: number;
  }[];
  dbOperations: number;
  apiCalls: number;
  dataSize: number;
}

/**
 * Run a performance benchmark on a scenario
 */
export const benchmarkScenario = action({
  args: {
    scenarioId: v.id("scenarios"),
    iterations: v.optional(v.number()),
    useOptimized: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    executionId: v.optional(v.id("scenario_executions")),
    metrics: v.optional(v.any()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get the user ID
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return { success: false, error: "Not authenticated" };
      }
      const userId = identity.subject;

      // Get the scenario
      try {
        const scenario = await ctx.runQuery(
          internal.integrations.scenarios.getScenarioById,
          {
            scenarioId: args.scenarioId,
          },
        );

        if (!scenario) {
          return { success: false, error: "Scenario not found" };
        }

        // Start metrics collection
        const startTime = Date.now();
        const metrics: Partial<ExecutionMetrics> = {
          nodeMetrics: [],
          dbOperations: 0,
          apiCalls: 0,
        };

        // Create a new execution
        try {
          const createExecutionResult = await ctx.runMutation(
            internal.integrations.scenarios.execution.createBenchmarkExecution,
            {
              scenarioId: args.scenarioId,
              userId: userId as Id<"users">,
              benchmarkMode: true,
              iterations: args.iterations ?? 1,
            },
          );

          if (
            !createExecutionResult.success ||
            !createExecutionResult.executionId
          ) {
            return { success: false, error: createExecutionResult.error };
          }

          const executionId = createExecutionResult.executionId;

          // Run the execution with performance tracking
          try {
            const executionResult = await ctx.runAction(
              args.useOptimized
                ? internal.integrations.scenarios.execution
                    .optimizedExecuteScenario
                : internal.integrations.scenarios.execution.executeScenario,
              {
                executionId,
                scenarioId: args.scenarioId,
                userId: userId as Id<"users">,
              },
            );

            // Calculate total duration
            metrics.totalDuration = Date.now() - startTime;

            // Get the execution details with node metrics
            try {
              const executionDetails = await ctx.runQuery(
                internal.integrations.scenarios.execution.getExecutionDetails,
                { executionId },
              );

              if (executionDetails?.nodeResults) {
                // Collect node-level metrics
                metrics.nodeMetrics = executionDetails.nodeResults.map(
                  (result: {
                    nodeId: Id<"nodes">;
                    type?: string;
                    startTime: number;
                    endTime?: number;
                    metrics?: {
                      preparationTime?: number;
                      executionTime?: number;
                      recordingTime?: number;
                    };
                  }) => ({
                    nodeId: result.nodeId,
                    type: result.type ?? "unknown",
                    startTime: result.startTime,
                    endTime: result.endTime ?? result.startTime,
                    duration: result.endTime
                      ? result.endTime - result.startTime
                      : 0,
                    preparationTime: result.metrics?.preparationTime ?? 0,
                    executionTime: result.metrics?.executionTime ?? 0,
                    recordingTime: result.metrics?.recordingTime ?? 0,
                  }),
                );
              }

              // Store the benchmark results
              await ctx.runMutation(
                internal.integrations.scenarios.execution
                  .recordBenchmarkResults,
                {
                  executionId,
                  metrics,
                },
              );

              return {
                success: executionResult.success,
                executionId,
                metrics,
                error: executionResult.error,
              };
            } catch (error) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "Unknown error getting execution details";
              return { success: false, error: errorMessage };
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Unknown error during execution";
            return { success: false, error: errorMessage };
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Unknown error creating execution";
          return { success: false, error: errorMessage };
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Unknown error getting scenario";
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error during benchmark";
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});

/**
 * Create a benchmark execution
 */
export const createBenchmarkExecution = mutation({
  args: {
    scenarioId: v.id("scenarios"),
    userId: v.id("users"),
    benchmarkMode: v.boolean(),
    iterations: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    executionId: v.optional(v.id("scenario_executions")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Create a new execution record
      const executionId = await ctx.db.insert("scenario_executions", {
        scenarioId: args.scenarioId,
        startTime: Date.now(),
        endTime: undefined,
        status: "running",
        trigger: {
          type: "benchmark",
          userId: args.userId,
          iterations: args.iterations,
          benchmarkMode: args.benchmarkMode,
          timestamp: Date.now(),
        },
        nodeResults: [],
        benchmarkMetrics: {
          enabled: true,
          iterations: args.iterations,
        },
      });

      return {
        success: true,
        executionId,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create benchmark execution",
      };
    }
  },
});

/**
 * Record benchmark results
 */
export const recordBenchmarkResults = mutation({
  args: {
    executionId: v.id("scenario_executions"),
    metrics: v.any(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    try {
      // Get the execution record
      const execution = await ctx.db.get(args.executionId);
      if (!execution) {
        return false;
      }

      // Update with benchmark metrics
      await ctx.db.patch(args.executionId, {
        benchmarkMetrics: {
          enabled: execution.benchmarkMetrics?.enabled ?? true,
          iterations: execution.benchmarkMetrics?.iterations ?? 1,
          results: args.metrics,
          completedAt: Date.now(),
        },
      });

      return true;
    } catch (error) {
      console.error("Error recording benchmark results:", error);
      return false;
    }
  },
});

/**
 * Get scenario performance metrics
 */
export const getScenarioPerformanceMetrics = query({
  args: {
    scenarioId: v.id("scenarios"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    // Get the user ID
    const userId = await getOptionalUserId(ctx);
    if (!userId) {
      return null;
    }

    // Get the scenario
    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario) {
      return null;
    }

    // Check if the user has access to this scenario
    if (scenario.createdBy !== userId) {
      return null;
    }

    // Find benchmark executions for this scenario
    const benchmarkExecutions = await ctx.db
      .query("scenario_executions")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.scenarioId))
      .filter((q) => q.eq(q.field("trigger.type"), "benchmark"))
      .order("desc")
      .take(10);

    // Compile metrics from benchmark executions
    const benchmarkResults = benchmarkExecutions.map((execution) => {
      // Safely extract benchmarkMetrics data using optional chaining and nullish coalescing
      const benchmarkMetricsResults = execution.benchmarkMetrics?.results ?? {};

      return {
        _id: execution._id,
        _creationTime: execution._creationTime,
        timestamp: execution.startTime,
        duration: benchmarkMetricsResults.totalDuration ?? 0,
        nodeCount: execution.nodeResults?.length ?? 0,
        optimized: execution.trigger?.optimized ?? false,
        iterations: execution.trigger?.iterations ?? 1,
        completedAt: execution.benchmarkMetrics?.completedAt,
        nodeMetrics: benchmarkMetricsResults.nodeMetrics ?? [],
      };
    });

    // Calculate performance insights
    const insights = analyzePerformanceMetrics(benchmarkResults);

    return {
      scenarioId: args.scenarioId,
      benchmarks: benchmarkResults,
      insights,
    };
  },
});

/**
 * Analyze performance metrics to generate insights
 */
interface BenchmarkResult {
  _id: Id<"scenario_executions">;
  _creationTime: number;
  timestamp: number;
  duration: number;
  nodeCount: number;
  optimized: boolean;
  iterations: number;
  completedAt?: number;
  nodeMetrics: {
    nodeId: Id<"nodes">;
    type: string;
    duration: number;
  }[];
}

function analyzePerformanceMetrics(benchmarks: BenchmarkResult[]) {
  if (benchmarks.length === 0) {
    return {
      recommendations: ["Run a benchmark to see performance insights"],
    };
  }

  // Sort benchmarks by timestamp
  benchmarks.sort((a, b) => a.timestamp - b.timestamp);

  // Find the latest benchmark
  const latestBenchmark = benchmarks[benchmarks.length - 1];

  // Find slow nodes
  const slowNodes = latestBenchmark.nodeMetrics
    .filter((node) => node.duration > 500) // Nodes taking more than 500ms
    .sort((a, b) => b.duration - a.duration);

  // Compare optimized vs non-optimized (if available)
  const optimizedBenchmarks = benchmarks.filter((b) => b.optimized);
  const standardBenchmarks = benchmarks.filter((b) => !b.optimized);

  let optimizationGain = null;
  if (optimizedBenchmarks.length > 0 && standardBenchmarks.length > 0) {
    const avgOptimized =
      optimizedBenchmarks.reduce((sum, b) => sum + b.duration, 0) /
      optimizedBenchmarks.length;
    const avgStandard =
      standardBenchmarks.reduce((sum, b) => sum + b.duration, 0) /
      standardBenchmarks.length;

    optimizationGain = {
      standard: avgStandard,
      optimized: avgOptimized,
      improvement:
        avgStandard > 0
          ? ((avgStandard - avgOptimized) / avgStandard) * 100
          : 0,
    };
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (slowNodes.length > 0) {
    recommendations.push(
      `Optimize slow nodes: ${slowNodes
        .slice(0, 3)
        .map((n) => n.nodeId.toString().slice(-4))
        .join(", ")}`,
    );
  }

  if (optimizationGain && optimizationGain.improvement > 10) {
    recommendations.push(
      `Use optimized execution for ~${Math.round(optimizationGain.improvement)}% better performance`,
    );
  }

  if (latestBenchmark.nodeMetrics.length > 15) {
    recommendations.push(
      "Consider breaking up large scenarios into smaller linked scenarios",
    );
  }

  return {
    slowNodes: slowNodes.slice(0, 5),
    optimizationGain,
    recommendations:
      recommendations.length > 0
        ? recommendations
        : ["No specific performance issues detected"],
  };
}

/**
 * Scenario Performance Metrics
 *
 * This file contains functions for tracking and analyzing scenario execution performance,
 * including execution time, failure rates, node-specific metrics, and historical trends.
 */

/**
 * Get overall performance metrics for all scenario executions
 */
export const getPerformanceMetrics = query({
  args: {},
  returns: v.object({
    totalExecutions: v.number(),
    avgExecutionDuration: v.number(),
    minExecutionDuration: v.optional(v.number()),
    maxExecutionDuration: v.optional(v.number()),
    successfulExecutions: v.number(),
    failedExecutions: v.number(),
    failureRate: v.number(),
    lastExecution: v.optional(v.number()),
    // Node type metrics
    nodeTypePerformance: v.record(
      v.string(),
      v.object({
        avgDuration: v.number(),
        count: v.number(),
        failureRate: v.number(),
      }),
    ),
    // Timeline data (grouped by day)
    executionTimeline: v.array(
      v.object({
        date: v.string(),
        count: v.number(),
        avgDuration: v.number(),
        failureRate: v.number(),
      }),
    ),
    // Scenarios with slowest avg execution time
    slowestScenarios: v.array(
      v.object({
        name: v.string(),
        avgDuration: v.number(),
        executionCount: v.number(),
      }),
    ),
  }),
  handler: async (ctx) => {
    // Get the user ID
    const userId = await getOptionalUserId(ctx);
    if (!userId) {
      // Return empty metrics if no user
      return {
        totalExecutions: 0,
        avgExecutionDuration: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        failureRate: 0,
        nodeTypePerformance: {},
        executionTimeline: [],
        slowestScenarios: [],
      };
    }

    // Get all completed executions
    const completedExecutions = await ctx.db
      .query("scenario_executions")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .collect();

    const failedExecutions = await ctx.db
      .query("scenario_executions")
      .withIndex("by_status", (q) => q.eq("status", "failed"))
      .collect();

    // Combine the two query results
    const executions = [...completedExecutions, ...failedExecutions];

    // Filter out executions for scenarios the user doesn't have access to
    const accessibleExecutions = [];
    for (const execution of executions) {
      const scenario = await ctx.db.get(execution.scenarioId);
      if (scenario && scenario.createdBy === userId) {
        accessibleExecutions.push({
          ...execution,
          scenarioName: scenario.name,
        });
      }
    }

    // If no executions, return empty metrics
    if (accessibleExecutions.length === 0) {
      return {
        totalExecutions: 0,
        avgExecutionDuration: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        failureRate: 0,
        nodeTypePerformance: {},
        executionTimeline: [],
        slowestScenarios: [],
      };
    }

    // Calculate overall metrics
    let totalDuration = 0;
    let minDuration = Number.MAX_SAFE_INTEGER;
    let maxDuration = 0;
    let successfulCount = 0;
    let failedCount = 0;
    let lastExecutionTime = 0;

    // Node type performance tracking
    const nodeTypePerformance: Record<
      string,
      { totalDuration: number; count: number; failures: number }
    > = {};

    // Timeline data
    const timelineData: Record<
      string,
      { count: number; totalDuration: number; failures: number }
    > = {};

    // Scenario performance tracking
    const scenarioPerformance: Record<
      string,
      { totalDuration: number; count: number; name: string }
    > = {};

    // Process each execution
    for (const execution of accessibleExecutions) {
      // Skip executions that don't have both start and end times
      if (!execution.startTime || !execution.endTime) continue;

      const duration = execution.endTime - execution.startTime;

      // Update overall metrics
      totalDuration += duration;
      minDuration = Math.min(minDuration, duration);
      maxDuration = Math.max(maxDuration, duration);

      if (execution.status === "completed") {
        successfulCount++;
      } else {
        failedCount++;
      }

      // Track last execution time
      if (execution.startTime > lastExecutionTime) {
        lastExecutionTime = execution.startTime;
      }

      // Update scenario performance
      const scenarioId = execution.scenarioId.toString();
      if (!scenarioPerformance[scenarioId]) {
        scenarioPerformance[scenarioId] = {
          totalDuration: 0,
          count: 0,
          name: execution.scenarioName || "Unknown Scenario",
        };
      }
      scenarioPerformance[scenarioId].totalDuration += duration;
      scenarioPerformance[scenarioId].count++;

      // Track node type performance
      for (const nodeResult of execution.nodeResults || []) {
        if (!nodeResult.startTime || !nodeResult.endTime) continue;

        const nodeType = nodeResult.type ?? "unknown";
        const nodeDuration = nodeResult.endTime - nodeResult.startTime;

        if (!nodeTypePerformance[nodeType]) {
          nodeTypePerformance[nodeType] = {
            totalDuration: 0,
            count: 0,
            failures: 0,
          };
        }

        nodeTypePerformance[nodeType].totalDuration += nodeDuration;
        nodeTypePerformance[nodeType].count++;

        if (nodeResult.status === "failed") {
          nodeTypePerformance[nodeType].failures++;
        }
      }

      // Group by day for timeline
      const date = new Date(execution.startTime).toISOString().split("T")[0];
      if (!timelineData[date]) {
        timelineData[date] = {
          count: 0,
          totalDuration: 0,
          failures: 0,
        };
      }

      timelineData[date].count++;
      timelineData[date].totalDuration += duration;
      if (execution.status === "failed") {
        timelineData[date].failures++;
      }
    }

    // Format node type performance data
    const formattedNodeTypePerformance: Record<
      string,
      { avgDuration: number; count: number; failureRate: number }
    > = {};

    for (const [type, data] of Object.entries(nodeTypePerformance)) {
      formattedNodeTypePerformance[type] = {
        avgDuration: data.count > 0 ? data.totalDuration / data.count : 0,
        count: data.count,
        failureRate: data.count > 0 ? data.failures / data.count : 0,
      };
    }

    // Format timeline data
    const formattedTimeline = Object.entries(timelineData)
      .map(([date, data]) => ({
        date,
        count: data.count,
        avgDuration: data.count > 0 ? data.totalDuration / data.count : 0,
        failureRate: data.count > 0 ? data.failures / data.count : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Format slowest scenarios
    const slowestScenarios = Object.values(scenarioPerformance)
      .map((data) => ({
        name: data.name,
        avgDuration: data.count > 0 ? data.totalDuration / data.count : 0,
        executionCount: data.count,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 5);

    // Return the metrics
    return {
      totalExecutions: accessibleExecutions.length,
      avgExecutionDuration:
        accessibleExecutions.length > 0
          ? totalDuration / accessibleExecutions.length
          : 0,
      minExecutionDuration:
        minDuration !== Number.MAX_SAFE_INTEGER ? minDuration : undefined,
      maxExecutionDuration: maxDuration > 0 ? maxDuration : undefined,
      successfulExecutions: successfulCount,
      failedExecutions: failedCount,
      failureRate:
        accessibleExecutions.length > 0
          ? failedCount / accessibleExecutions.length
          : 0,
      lastExecution: lastExecutionTime > 0 ? lastExecutionTime : undefined,
      nodeTypePerformance: formattedNodeTypePerformance,
      executionTimeline: formattedTimeline,
      slowestScenarios,
    };
  },
});

/**
 * Get performance metrics for a specific scenario
 */
export const getDetailedScenarioPerformanceMetrics = query({
  args: {
    scenarioId: v.id("scenarios"),
  },
  returns: v.object({
    executionCount: v.number(),
    avgExecutionDuration: v.number(),
    successRate: v.number(),
    // Node-specific metrics
    nodeMetrics: v.array(
      v.object({
        nodeId: v.id("nodes"),
        type: v.string(),
        avgDuration: v.number(),
        failureRate: v.number(),
        executionCount: v.number(),
      }),
    ),
    // Execution trend over time
    executionTrend: v.array(
      v.object({
        date: v.string(),
        duration: v.number(),
        status: v.string(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    // Get the user ID
    const userId = await getOptionalUserId(ctx);
    if (!userId) {
      return {
        executionCount: 0,
        avgExecutionDuration: 0,
        successRate: 0,
        nodeMetrics: [],
        executionTrend: [],
      };
    }

    // Get the scenario
    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario || scenario.createdBy !== userId) {
      return {
        executionCount: 0,
        avgExecutionDuration: 0,
        successRate: 0,
        nodeMetrics: [],
        executionTrend: [],
      };
    }

    // Get all executions for this scenario
    const executions = await ctx.db
      .query("scenario_executions")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.scenarioId))
      .collect();

    // If no executions, return empty metrics
    if (executions.length === 0) {
      return {
        executionCount: 0,
        avgExecutionDuration: 0,
        successRate: 0,
        nodeMetrics: [],
        executionTrend: [],
      };
    }

    // Calculate overall metrics
    let totalDuration = 0;
    let successCount = 0;

    // Node metrics tracking
    const nodeMetricsMap: Record<
      string,
      {
        nodeId: string;
        type: string;
        totalDuration: number;
        failureCount: number;
        executionCount: number;
      }
    > = {};

    // Execution trend data
    const executionTrend = [];

    // Process each execution
    for (const execution of executions) {
      // Skip executions that don't have both start and end times
      if (!execution.startTime || !execution.endTime) continue;

      const duration = execution.endTime - execution.startTime;
      totalDuration += duration;

      if (execution.status === "completed") {
        successCount++;
      }

      // Add to execution trend
      executionTrend.push({
        date: new Date(execution.startTime).toISOString().split("T")[0],
        duration,
        status: execution.status,
      });

      // Process node results
      for (const nodeResult of execution.nodeResults || []) {
        if (!nodeResult.startTime || !nodeResult.endTime) continue;

        const nodeId = nodeResult.nodeId.toString();
        const nodeDuration = nodeResult.endTime - nodeResult.startTime;

        if (!nodeMetricsMap[nodeId]) {
          nodeMetricsMap[nodeId] = {
            nodeId,
            type: nodeResult.type ?? "unknown",
            totalDuration: 0,
            failureCount: 0,
            executionCount: 0,
          };
        }

        nodeMetricsMap[nodeId].totalDuration += nodeDuration;
        nodeMetricsMap[nodeId].executionCount++;

        if (nodeResult.status === "failed") {
          nodeMetricsMap[nodeId].failureCount++;
        }
      }
    }

    // Format node metrics
    const nodeMetrics = Object.values(nodeMetricsMap).map((data) => ({
      nodeId: data.nodeId as any, // Cast to satisfy TypeScript
      type: data.type,
      avgDuration:
        data.executionCount > 0 ? data.totalDuration / data.executionCount : 0,
      failureRate:
        data.executionCount > 0 ? data.failureCount / data.executionCount : 0,
      executionCount: data.executionCount,
    }));

    // Sort execution trend by date
    const sortedExecutionTrend = executionTrend.sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    return {
      executionCount: executions.length,
      avgExecutionDuration:
        executions.length > 0 ? totalDuration / executions.length : 0,
      successRate: executions.length > 0 ? successCount / executions.length : 0,
      nodeMetrics,
      executionTrend: sortedExecutionTrend,
    };
  },
});
