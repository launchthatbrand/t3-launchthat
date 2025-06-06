/**
 * Scenario Execution Monitoring
 *
 * This file provides functionality for monitoring scenario executions,
 * including logging, progress tracking, and metrics collection.
 */

import { v } from "convex/values";

import { internalMutation, internalQuery } from "../../_generated/server";

/**
 * Log an execution event to the execution_events table
 */
export const logExecutionEvent = internalMutation({
  args: {
    executionId: v.id("scenario_executions"),
    eventType: v.string(),
    nodeId: v.optional(v.id("nodes")),
    details: v.any(),
    level: v.optional(
      v.union(
        v.literal("debug"),
        v.literal("info"),
        v.literal("warning"),
        v.literal("error"),
        v.literal("critical"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    // Get the execution to verify it exists
    const execution = await ctx.db.get(args.executionId);
    if (!execution) {
      throw new Error(`Execution ${args.executionId} not found`);
    }

    // Log the event
    const eventId = await ctx.db.insert("execution_events", {
      executionId: args.executionId,
      eventType: args.eventType,
      nodeId: args.nodeId,
      timestamp: Date.now(),
      details: args.details,
      level: args.level ?? "info",
    });

    // Also update the execution lastUpdated field
    await ctx.db.patch(args.executionId, {
      lastUpdated: Date.now(),
    });

    return eventId;
  },
});

/**
 * Update execution progress
 */
export const updateExecutionProgress = internalMutation({
  args: {
    executionId: v.id("scenario_executions"),
    progress: v.number(), // 0-100
    currentNodeId: v.optional(v.id("nodes")),
    estimatedTimeRemaining: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get the execution to verify it exists
    const execution = await ctx.db.get(args.executionId);
    if (!execution) {
      throw new Error(`Execution ${args.executionId} not found`);
    }

    // Update the progress
    await ctx.db.patch(args.executionId, {
      progress: args.progress,
      currentNodeId: args.currentNodeId,
      estimatedTimeRemaining: args.estimatedTimeRemaining,
      lastUpdated: Date.now(),
    });

    // Log the progress update
    await ctx.db.insert("execution_events", {
      executionId: args.executionId,
      eventType: "progress_updated",
      nodeId: args.currentNodeId,
      timestamp: Date.now(),
      details: {
        progress: args.progress,
        estimatedTimeRemaining: args.estimatedTimeRemaining,
      },
      level: "debug",
    });

    return { success: true };
  },
});

/**
 * Get execution events for a specific execution
 */
export const getExecutionEvents = internalQuery({
  args: {
    executionId: v.id("scenario_executions"),
    limit: v.optional(v.number()),
    minLevel: v.optional(
      v.union(
        v.literal("debug"),
        v.literal("info"),
        v.literal("warning"),
        v.literal("error"),
        v.literal("critical"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    // Build the query based on the level filter
    const events = await ctx.db
      .query("execution_events")
      .withIndex("by_execution", (q) => q.eq("executionId", args.executionId))
      .order("desc")
      .take(limit);

    // Filter by min level if specified
    if (args.minLevel) {
      const levelOrder = ["debug", "info", "warning", "error", "critical"];
      const minLevelIndex = levelOrder.indexOf(args.minLevel);

      return events.filter((event) => {
        if (!event.level) return false;
        const eventLevelIndex = levelOrder.indexOf(event.level as string);
        return eventLevelIndex >= minLevelIndex;
      });
    }

    return events;
  },
});

/**
 * Get node execution events
 */
export const getNodeEvents = internalQuery({
  args: {
    nodeId: v.id("nodes"),
    executionId: v.optional(v.id("scenario_executions")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    // If execution ID is provided, get events for that specific execution
    if (args.executionId) {
      return await ctx.db
        .query("execution_events")
        .withIndex("by_node", (q) => q.eq("nodeId", args.nodeId))
        .filter((q) => q.eq(q.field("executionId"), args.executionId))
        .order("desc")
        .take(limit);
    }

    // Otherwise, get the latest events for this node across executions
    return await ctx.db
      .query("execution_events")
      .withIndex("by_node", (q) => q.eq("nodeId", args.nodeId))
      .order("desc")
      .take(limit);
  },
});

/**
 * Get execution metrics
 */
export const getExecutionMetrics = internalQuery({
  args: {
    executionId: v.id("scenario_executions"),
  },
  handler: async (ctx, args) => {
    // Get the execution
    const execution = await ctx.db.get(args.executionId);
    if (!execution) {
      throw new Error(`Execution ${args.executionId} not found`);
    }

    // Calculate metrics if not already stored
    if (!execution.metrics) {
      // Get all events for this execution
      const events = await ctx.db
        .query("execution_events")
        .withIndex("by_execution", (q) => q.eq("executionId", args.executionId))
        .collect();

      // Calculate time-based metrics
      const startEvent = events.find(
        (e) => e.eventType === "execution_started",
      );
      const endEvent = events.find(
        (e) =>
          e.eventType === "execution_completed" ||
          e.eventType === "execution_failed",
      );

      const metrics: {
        totalDuration?: number;
        nodeMetrics: Record<string, any>;
        eventCounts: Record<string, number>;
        status: string;
      } = {
        totalDuration:
          startEvent && endEvent
            ? endEvent.timestamp - startEvent.timestamp
            : undefined,
        nodeMetrics: {},
        eventCounts: {},
        status: execution.status,
      };

      // Count event types
      events.forEach((event) => {
        metrics.eventCounts[event.eventType] =
          (metrics.eventCounts[event.eventType] || 0) + 1;
      });

      // Calculate per-node metrics
      const nodeEvents = events.filter((e) => e.nodeId !== undefined);
      const nodeIds = [...new Set(nodeEvents.map((e) => e.nodeId))];

      nodeIds.forEach((nodeId) => {
        if (!nodeId) return;

        const nodeStart = events.find(
          (e) =>
            e.eventType === "node_started" &&
            e.nodeId?.toString() === nodeId.toString(),
        );
        const nodeComplete = events.find(
          (e) =>
            (e.eventType === "node_completed" ||
              e.eventType === "node_failed") &&
            e.nodeId?.toString() === nodeId.toString(),
        );

        if (nodeStart && nodeComplete) {
          const nodeIdString = nodeId.toString();
          metrics.nodeMetrics[nodeIdString] = {
            duration: nodeComplete.timestamp - nodeStart.timestamp,
            status:
              nodeComplete.eventType === "node_completed"
                ? "completed"
                : "failed",
            retries: events.filter(
              (e) =>
                e.eventType === "retry_attempted" &&
                e.nodeId?.toString() === nodeId.toString(),
            ).length,
          };
        }
      });

      return metrics;
    }

    return execution.metrics;
  },
});

/**
 * Update execution with metrics
 */
export const updateExecutionMetrics = internalMutation({
  args: {
    executionId: v.id("scenario_executions"),
    metrics: v.any(),
  },
  handler: async (ctx, args) => {
    // Get the execution to verify it exists
    const execution = await ctx.db.get(args.executionId);
    if (!execution) {
      throw new Error(`Execution ${args.executionId} not found`);
    }

    // Update the metrics
    await ctx.db.patch(args.executionId, {
      metrics: args.metrics,
      lastUpdated: Date.now(),
    });

    return { success: true };
  },
});
