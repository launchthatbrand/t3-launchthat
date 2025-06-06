/**
 * Scenario Execution Recovery Mechanisms
 *
 * This file provides functionality for recovering from scenario execution failures,
 * including saving execution state, handling partial failures, and resuming executions.
 */

import { v } from "convex/values";

import { internal } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "../../_generated/server";
import { ScenarioExecution } from "../schema/types";

/**
 * Save execution checkpoint for potential recovery
 */
export const saveExecutionCheckpoint = internalMutation({
  args: {
    executionId: v.id("scenario_executions"),
    checkpoint: v.object({
      completedNodes: v.array(v.id("nodes")),
      currentNodeId: v.optional(v.id("nodes")),
      nodeOutputs: v.object({}),
      timestamp: v.number(),
      metadata: v.optional(v.object({})),
    }),
  },
  handler: async (ctx, args) => {
    // Get the execution record
    const execution = await ctx.db.get(args.executionId);
    if (!execution) {
      throw new Error(`Execution ${args.executionId} not found`);
    }

    // Create a checkpoint record
    const checkpointId = await ctx.db.insert("execution_checkpoints", {
      executionId: args.executionId,
      scenarioId: execution.scenarioId,
      checkpoint: args.checkpoint,
      createdAt: Date.now(),
    });

    // Update the execution with the latest checkpoint ID
    await ctx.db.patch(args.executionId, {
      lastCheckpointId: checkpointId,
    });

    return { success: true, checkpointId };
  },
});

/**
 * Get the latest checkpoint for an execution
 */
export const getLatestCheckpoint = internalQuery({
  args: {
    executionId: v.id("scenario_executions"),
  },
  handler: async (ctx, args) => {
    // Get the execution record
    const execution = (await ctx.db.get(
      args.executionId,
    )) as ScenarioExecution | null;
    if (!execution) {
      throw new Error(`Execution ${args.executionId} not found`);
    }

    // If there's no checkpoint ID, return null
    if (!execution.lastCheckpointId) {
      return null;
    }

    // Get the checkpoint record
    const checkpoint = await ctx.db.get(execution.lastCheckpointId);
    return checkpoint;
  },
});

/**
 * Resume execution from a checkpoint
 */
export const resumeExecution = internalAction({
  args: {
    executionId: v.id("scenario_executions"),
    checkpointId: v.optional(v.id("execution_checkpoints")),
    startFromNodeId: v.optional(v.id("nodes")),
    skipFailedNode: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      // Get the execution record
      const execution = await ctx.runQuery(
        internal.integrations.scenarios.execution.getExecutionById,
        { executionId: args.executionId },
      );

      if (!execution) {
        throw new Error(`Execution ${args.executionId} not found`);
      }

      // Only allow resuming failed executions
      if (execution.status !== "failed") {
        throw new Error(
          `Cannot resume execution with status: ${execution.status}`,
        );
      }

      // Get the scenario
      const scenario = await ctx.runQuery(
        internal.integrations.scenarios.getScenarioById,
        { scenarioId: execution.scenarioId },
      );

      if (!scenario) {
        throw new Error(`Scenario ${execution.scenarioId} not found`);
      }

      // Get checkpoint to use (either provided or the latest)
      const checkpoint = args.checkpointId
        ? await ctx.runQuery(
            internal.integrations.scenarios.recovery.getCheckpoint,
            {
              checkpointId: args.checkpointId,
            },
          )
        : await ctx.runQuery(
            internal.integrations.scenarios.recovery.getLatestCheckpoint,
            {
              executionId: args.executionId,
            },
          );

      if (!checkpoint && !args.startFromNodeId) {
        throw new Error(
          "No checkpoint available and no starting node provided",
        );
      }

      // Create a new execution record based on the failed one
      const newExecutionId = await ctx.runMutation(
        internal.integrations.scenarios.recovery.createRecoveryExecution,
        {
          originalExecutionId: args.executionId,
          startFromNodeId: args.startFromNodeId,
          checkpoint: checkpoint?.checkpoint,
          skipFailedNode: args.skipFailedNode,
        },
      );

      // Log the resumption
      await ctx.runMutation(
        internal.integrations.scenarios.monitoring.logExecutionEvent,
        {
          executionId: newExecutionId,
          eventType: "execution_resumed",
          details: {
            originalExecutionId: args.executionId,
            checkpointId: checkpoint?._id,
            startFromNodeId: args.startFromNodeId,
            skipFailedNode: args.skipFailedNode,
            timestamp: Date.now(),
          },
        },
      );

      // Start the execution
      await ctx.runAction(
        internal.integrations.scenarios.execution.executeScenario,
        {
          executionId: newExecutionId,
          scenarioId: execution.scenarioId,
          userId: scenario.createdBy,
          isRecovery: true,
        },
      );

      return {
        success: true,
        newExecutionId,
        originalExecutionId: args.executionId,
      };
    } catch (error) {
      console.error(`Error resuming execution:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Create a new execution for recovery purposes
 */
export const createRecoveryExecution = internalMutation({
  args: {
    originalExecutionId: v.id("scenario_executions"),
    startFromNodeId: v.optional(v.id("nodes")),
    checkpoint: v.optional(
      v.object({
        completedNodes: v.array(v.id("nodes")),
        currentNodeId: v.optional(v.id("nodes")),
        nodeOutputs: v.object({}),
        timestamp: v.number(),
        metadata: v.optional(v.object({})),
      }),
    ),
    skipFailedNode: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get the original execution
    const originalExecution = await ctx.db.get(args.originalExecutionId);
    if (!originalExecution) {
      throw new Error(
        `Original execution ${args.originalExecutionId} not found`,
      );
    }

    // Get the node to start from (either from args or from checkpoint)
    let startNodeId = args.startFromNodeId;
    let preservedNodeOutputs = {};
    let completedNodeIds: Id<"nodes">[] = [];

    // If we have a checkpoint, use it to determine the starting point and preserved outputs
    if (args.checkpoint) {
      completedNodeIds = args.checkpoint.completedNodes;
      preservedNodeOutputs = args.checkpoint.nodeOutputs;

      // If no explicit start node is provided, use the checkpoint's current node
      if (!startNodeId && args.checkpoint.currentNodeId) {
        startNodeId = args.checkpoint.currentNodeId;
      }
    }

    // If we're skipping the failed node, find the next node
    if (args.skipFailedNode && startNodeId) {
      const nodes = await ctx.db
        .query("nodes")
        .withIndex("by_scenario", (q) =>
          q.eq("scenarioId", originalExecution.scenarioId),
        )
        .order("asc")
        .collect();

      // Find the current node position
      const currentNodeIndex = nodes.findIndex(
        (node) => node._id.toString() === startNodeId?.toString(),
      );

      // If found and there's a next node, set it as the start node
      if (currentNodeIndex >= 0 && currentNodeIndex < nodes.length - 1) {
        startNodeId = nodes[currentNodeIndex + 1]._id;
      }
    }

    // Create a new execution record
    const newExecutionId = await ctx.db.insert("scenario_executions", {
      scenarioId: originalExecution.scenarioId,
      startTime: Date.now(),
      endTime: undefined,
      status: "running",
      trigger: {
        type: "recovery",
        originalExecutionId: args.originalExecutionId,
        checkpoint: args.checkpoint ? true : false,
        skipFailedNode: args.skipFailedNode ?? false,
        timestamp: Date.now(),
      },
      nodeResults: [],
      recoveryData: {
        originalExecutionId: args.originalExecutionId,
        completedNodeIds,
        preservedNodeOutputs,
        startNodeId,
        isRecovery: true,
      },
    });

    // Update the original execution to reference the recovery attempt
    await ctx.db.patch(args.originalExecutionId, {
      recoveryExecutionId: newExecutionId,
    });

    return newExecutionId;
  },
});

/**
 * Get a specific checkpoint
 */
export const getCheckpoint = internalQuery({
  args: {
    checkpointId: v.id("execution_checkpoints"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.checkpointId);
  },
});

/**
 * Get all checkpoints for an execution
 */
export const getExecutionCheckpoints = internalQuery({
  args: {
    executionId: v.id("scenario_executions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("execution_checkpoints")
      .withIndex("by_execution", (q) => q.eq("executionId", args.executionId))
      .order("desc")
      .collect();
  },
});

/**
 * Delete a checkpoint
 */
export const deleteCheckpoint = internalMutation({
  args: {
    checkpointId: v.id("execution_checkpoints"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.checkpointId);
    return { success: true };
  },
});
