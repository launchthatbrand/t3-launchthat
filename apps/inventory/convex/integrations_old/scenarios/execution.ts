/**
 * Scenario execution engine for integration scenarios
 *
 * This file provides functions for executing scenarios, managing the flow of data
 * between nodes, handling errors, and tracking execution status.
 */

import { v } from "convex/values";

import { internal } from "../../_generated/api";
import { Doc, Id } from "../../_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "../../_generated/server";
import { getOptionalUserId, requireUserId } from "../lib/auth";
import {
  ExecutionStatus,
  NodeExecutionStatus,
  NodeType,
  ScenarioStatus,
} from "../schema/types";

// Define execution-specific audit event types
const EXECUTION_AUDIT_EVENTS = {
  EXECUTION_START: "execution_start",
  EXECUTION_COMPLETE: "execution_complete",
  EXECUTION_FAILED: "execution_failed",
  NODE_EXECUTION_START: "node_execution_start",
  NODE_EXECUTION_COMPLETE: "node_execution_complete",
  NODE_EXECUTION_FAILED: "node_execution_failed",
  NODE_EXECUTION_SKIPPED: "node_execution_skipped",
} as const;

// Max execution time in milliseconds (10 minutes)
const MAX_EXECUTION_TIME = 10 * 60 * 1000;

// Max retry attempts for failed nodes
const MAX_RETRY_ATTEMPTS = 3;

// Default timeout for node execution (30 seconds)
const DEFAULT_NODE_TIMEOUT = 30 * 1000;

// Interface for node execution context
interface NodeExecutionContext {
  executionId: Id<"scenario_executions">;
  scenarioId: Id<"scenarios">;
  nodeId: Id<"nodes">;
  input: Record<string, unknown>;
  previousOutputs: Record<string, Record<string, unknown>>;
  retryCount: number;
}

/**
 * Log an execution audit event
 */
async function logExecutionAuditEvent(
  ctx: any,
  args: {
    event: string;
    userId: Id<"users"> | null;
    scenarioId: Id<"scenarios">;
    executionId: Id<"scenario_executions">;
    nodeId?: Id<"nodes">;
    details: Record<string, unknown>;
  },
) {
  await ctx.runMutation(internal.integrations.audit.logAuditEvent, {
    event: args.event,
    userId: args.userId,
    resourceType: "scenario_execution",
    resourceId: args.executionId.toString(),
    metadata: {
      scenarioId: args.scenarioId,
      executionId: args.executionId,
      nodeId: args.nodeId,
      ...args.details,
    },
  });
}

/**
 * Start the execution of a scenario manually
 */
export const startScenarioExecution = mutation({
  args: {
    scenarioId: v.id("scenarios"),
    initialData: v.optional(v.any()),
  },
  returns: v.object({
    success: v.boolean(),
    executionId: v.optional(v.id("scenario_executions")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Get the user ID
    const userId = await requireUserId(ctx);

    try {
      // Get the scenario
      const scenario = await ctx.db.get(args.scenarioId);
      if (!scenario) {
        return {
          success: false,
          error: "Scenario not found",
        };
      }

      // Check if the user has access to this scenario
      if (scenario.createdBy !== userId) {
        return {
          success: false,
          error: "Access denied",
        };
      }

      // Check if the scenario is in a valid state to be executed
      if (scenario.status !== "active" && scenario.status !== "draft") {
        return {
          success: false,
          error: `Cannot execute scenario with status: ${scenario.status}`,
        };
      }

      // Create a new execution record
      const executionId = await ctx.db.insert("scenario_executions", {
        scenarioId: args.scenarioId,
        startTime: Date.now(),
        endTime: null,
        status: "running",
        trigger: {
          type: "manual",
          userId: userId,
          initialData: args.initialData ?? {},
          timestamp: Date.now(),
        },
        nodeResults: [],
      });

      // Update the scenario with the last run time
      await ctx.db.patch(args.scenarioId, {
        lastRun: Date.now(),
      });

      // Log the execution start
      await ctx.db.insert("audit_logs", {
        action: EXECUTION_AUDIT_EVENTS.EXECUTION_START,
        resourceType: "scenario_execution",
        resourceId: executionId.toString(),
        userId,
        timestamp: Date.now(),
        metadata: {
          scenarioId: args.scenarioId,
          executionId,
          triggerType: "manual",
        },
      });

      // Schedule the execution to run
      await ctx.scheduler.runAfter(
        0,
        internal.integrations.scenarios.execution.executeScenario,
        {
          executionId,
          scenarioId: args.scenarioId,
          userId,
        },
      );

      return {
        success: true,
        executionId,
      };
    } catch (error) {
      console.error("Error starting scenario execution:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Execute a scenario given a trigger event
 */
export const executeScenario = internalAction({
  args: {
    scenarioId: v.id("scenarios"),
    executionId: v.id("scenario_executions"),
    trigger: v.any(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const scenario = await ctx.runQuery(
        internal.integrations.scenarios.getScenarioWithNodes,
        { scenarioId: args.scenarioId },
      );

      if (!scenario) {
        throw new Error(`Scenario ${args.scenarioId} not found`);
      }

      const nodes = scenario.nodes || [];
      if (nodes.length === 0) {
        throw new Error("Scenario has no nodes");
      }

      // Get a reference to the current user (may be null for automated triggers)
      const userId = scenario.createdBy as Id<"users"> | null;

      // Log the execution start
      await logExecutionAuditEvent(ctx, {
        event: "scenario_execution_started",
        userId,
        scenarioId: args.scenarioId,
        executionId: args.executionId,
        details: {
          trigger: args.trigger,
        },
      });

      // Sort nodes by dependency order
      const sortedNodes = sortNodesByDependencyOrder(nodes);

      // Track completed nodes to prevent re-execution
      const completedNodes = new Set<string>();
      let currentIndex = 0;
      let success = true;
      let error: string | undefined;

      // Store node outputs for dependency mapping
      const nodeOutputs: Record<string, Record<string, unknown>> = {};

      // Execute each node in order
      while (currentIndex < sortedNodes.length && success) {
        const node = sortedNodes[currentIndex];
        const nodeId = node._id.toString();

        // Skip if this node is already completed
        if (completedNodes.has(nodeId)) {
          currentIndex++;
          continue;
        }

        // Check if dependencies are completed
        if (node.dependsOn && node.dependsOn.length > 0) {
          const allDependenciesMet = node.dependsOn.every((depId) =>
            completedNodes.has(depId.toString()),
          );

          if (!allDependenciesMet) {
            // Skip this node for now, we'll come back to it
            currentIndex++;
            continue;
          }
        }

        try {
          // Record node execution start
          await ctx.runMutation(
            internal.integrations.scenarios.execution.recordNodeStart,
            {
              executionId: args.executionId,
              nodeId: node._id,
              type: node.type,
            },
          );

          // Update execution progress
          await ctx.runMutation(
            internal.integrations.scenarios.monitoring.updateExecutionNodeStats,
            {
              executionId: args.executionId,
            },
          );

          // Prepare node input data based on input mappings
          const nodeInput = await prepareNodeInput(node, nodeOutputs);

          // Log the node execution
          await logExecutionAuditEvent(ctx, {
            event: "node_execution_started",
            userId,
            scenarioId: args.scenarioId,
            executionId: args.executionId,
            nodeId: node._id,
            details: {
              nodeType: node.type,
              input: nodeInput,
            },
          });

          // Execute the node based on its type
          let nodeResult: NodeExecutionResult;

          switch (node.type) {
            case "webhook":
              nodeResult = await executeWebhookNode(ctx, {
                node,
                input: nodeInput,
                previousOutputs: nodeOutputs,
                executionId: args.executionId,
                scenarioId: args.scenarioId,
              });
              break;

            case "transformer":
              nodeResult = await executeTransformerNode(ctx, {
                node,
                input: nodeInput,
                previousOutputs: nodeOutputs,
                executionId: args.executionId,
                scenarioId: args.scenarioId,
              });
              break;

            case "action":
              nodeResult = await executeActionNode(ctx, {
                node,
                input: nodeInput,
                previousOutputs: nodeOutputs,
                executionId: args.executionId,
                scenarioId: args.scenarioId,
              });
              break;

            case "condition":
              nodeResult = await evaluateConditionNode(ctx, {
                node,
                input: nodeInput,
                previousOutputs: nodeOutputs,
                executionId: args.executionId,
                scenarioId: args.scenarioId,
              });
              break;

            default:
              throw new Error(`Unknown node type: ${node.type}`);
          }

          // Store node output
          nodeOutputs[node._id.toString()] = nodeResult.output || {};

          // Record node result
          await ctx.runMutation(
            internal.integrations.scenarios.execution.recordNodeResult,
            {
              executionId: args.executionId,
              nodeId: node._id,
              status: "completed",
              input: nodeInput,
              output: nodeResult.output,
              error: nodeResult.error,
            },
          );

          // Update execution progress
          await ctx.runMutation(
            internal.integrations.scenarios.monitoring.updateExecutionNodeStats,
            {
              executionId: args.executionId,
            },
          );

          // If this is a condition node that evaluated to false,
          // mark dependent nodes as skipped
          if (
            node.type === "condition" &&
            nodeResult.success &&
            nodeResult.output?.result === false
          ) {
            // Find nodes that depend on this condition
            const affectedNodes = nodes.filter(
              (n) => n.dependsOn && n.dependsOn.includes(node._id),
            );

            // Mark them as skipped
            for (const affectedNode of affectedNodes) {
              await ctx.runMutation(
                internal.integrations.scenarios.execution.recordNodeSkipped,
                {
                  executionId: args.executionId,
                  nodeId: affectedNode._id,
                  conditionNodeId: node._id,
                },
              );

              // Add to completed nodes so we don't try to execute them
              completedNodes.add(affectedNode._id.toString());
            }

            // Update execution progress after skipping nodes
            await ctx.runMutation(
              internal.integrations.scenarios.monitoring
                .updateExecutionNodeStats,
              {
                executionId: args.executionId,
              },
            );
          }
        } catch (nodeError) {
          console.error(`Error executing node ${node._id}:`, nodeError);

          try {
            // Classify the error
            const errorClassification = await ctx.runAction(
              internal.integrations.scenarios.errorHandling.classifyError,
              { error: nodeError },
            );

            // Log the error event with classification details
            await ctx.runMutation(
              internal.integrations.scenarios.monitoring.logExecutionEvent,
              {
                executionId: args.executionId,
                eventType: "node_failed",
                nodeId: node._id,
                details: {
                  errorMessage: nodeError.message || "Unknown error",
                  errorClassification,
                  timestamp: Date.now(),
                },
                level: "error",
              },
            );

            // Get recommended recovery action
            const context = {
              isEssentialNode: node.config?.essential === true,
              nodeType: node.type,
            };

            // Determine retry attempts made so far
            const retryAttempt =
              nodeOutputs[node._id.toString()]?.retryCount || 0;

            const recoveryAction = await ctx.runAction(
              internal.integrations.scenarios.errorHandling.getRecoveryAction,
              {
                errorClassification,
                retryAttempt,
                nodeType: node.type,
                context,
              },
            );

            // Handle recovery action
            switch (recoveryAction.action) {
              case "retry":
                // Save checkpoint before retry
                await ctx.runMutation(
                  internal.integrations.scenarios.recovery
                    .saveExecutionCheckpoint,
                  {
                    executionId: args.executionId,
                    checkpoint: {
                      completedNodes: Array.from(completedNodes).map(
                        (id) => id as unknown as Id<"nodes">,
                      ),
                      currentNodeId: node._id,
                      nodeOutputs,
                      timestamp: Date.now(),
                    },
                  },
                );

                // Update retry count
                await ctx.runMutation(
                  internal.integrations.scenarios.execution
                    .updateExecutionRetryCount,
                  {
                    executionId: args.executionId,
                    nodeId: node._id,
                    retryCount: retryAttempt + 1,
                    maxRetries:
                      scenario.errorHandling?.retryCount || MAX_RETRY_ATTEMPTS,
                    lastRetryTime: Date.now(),
                  },
                );

                // Log retry attempt
                await ctx.runMutation(
                  internal.integrations.scenarios.monitoring.logExecutionEvent,
                  {
                    executionId: args.executionId,
                    eventType: "retry_attempted",
                    nodeId: node._id,
                    details: {
                      attempt: retryAttempt + 1,
                      maxRetries:
                        scenario.errorHandling?.retryCount ||
                        MAX_RETRY_ATTEMPTS,
                      delay: recoveryAction.delay,
                      reason: recoveryAction.reason,
                    },
                    level: "warning",
                  },
                );

                // Store retry info in node outputs
                nodeOutputs[node._id.toString()] = {
                  ...nodeOutputs[node._id.toString()],
                  retryCount: retryAttempt + 1,
                  lastRetryTime: Date.now(),
                };

                // Don't mark as completed, we'll retry on next iteration
                currentIndex--; // Re-run this node

                // If a delay is recommended, wait before retrying
                if (recoveryAction.delay) {
                  await new Promise((resolve) =>
                    setTimeout(resolve, recoveryAction.delay),
                  );
                }
                break;

              case "skip":
                // Record node as skipped after failure
                await ctx.runMutation(
                  internal.integrations.scenarios.execution.recordNodeResult,
                  {
                    executionId: args.executionId,
                    nodeId: node._id,
                    status: "skipped",
                    input: nodeInput || {},
                    output: null,
                    error: nodeError.message || "Unknown error",
                  },
                );

                // Log skip action
                await ctx.runMutation(
                  internal.integrations.scenarios.monitoring.logExecutionEvent,
                  {
                    executionId: args.executionId,
                    eventType: "node_skipped",
                    nodeId: node._id,
                    details: {
                      reason: recoveryAction.reason,
                      errorClassification,
                    },
                    level: "warning",
                  },
                );

                // Mark as completed so we move to the next node
                completedNodes.add(nodeId);
                break;

              case "fallback":
                // Use fallback value
                nodeOutputs[node._id.toString()] = {
                  ...nodeOutputs[node._id.toString()],
                  ...recoveryAction.fallbackValue,
                  _usedFallback: true,
                };

                // Record node as completed with fallback
                await ctx.runMutation(
                  internal.integrations.scenarios.execution.recordNodeResult,
                  {
                    executionId: args.executionId,
                    nodeId: node._id,
                    status: "completed",
                    input: nodeInput || {},
                    output: recoveryAction.fallbackValue,
                    error: {
                      message: nodeError.message || "Unknown error",
                      usedFallback: true,
                    },
                  },
                );

                // Log fallback usage
                await ctx.runMutation(
                  internal.integrations.scenarios.monitoring.logExecutionEvent,
                  {
                    executionId: args.executionId,
                    eventType: "fallback_used",
                    nodeId: node._id,
                    details: {
                      fallbackValue: recoveryAction.fallbackValue,
                      reason: recoveryAction.reason,
                    },
                    level: "info",
                  },
                );

                // Mark as completed so we move to the next node
                completedNodes.add(nodeId);
                break;

              case "notify":
                // Send notification (if configured)
                if (scenario.errorHandling?.notifyOnError) {
                  const formattedError = await ctx.runAction(
                    internal.integrations.scenarios.errorHandling
                      .formatErrorForDisplay,
                    {
                      error: nodeError,
                      errorClassification,
                      context: {
                        nodeId: node._id,
                        nodeType: node.type,
                        scenarioId: args.scenarioId,
                        executionId: args.executionId,
                      },
                    },
                  );

                  await ctx.runAction(
                    internal.integrations.scenarios.notifications
                      .sendNotification,
                    {
                      userId: userId,
                      title: formattedError.title,
                      message: formattedError.message,
                      details: formattedError.details || "",
                      resourceType: "scenario_execution",
                      resourceId: args.executionId,
                      category: "error",
                      priority: "high",
                    },
                  );
                }

                // Record node failure
                await ctx.runMutation(
                  internal.integrations.scenarios.execution.recordNodeResult,
                  {
                    executionId: args.executionId,
                    nodeId: node._id,
                    status: "failed",
                    input: nodeInput || {},
                    output: null,
                    error: nodeError.message || "Unknown error",
                  },
                );

                // Save execution state before aborting
                await ctx.runMutation(
                  internal.integrations.scenarios.recovery
                    .saveExecutionCheckpoint,
                  {
                    executionId: args.executionId,
                    checkpoint: {
                      completedNodes: Array.from(completedNodes).map(
                        (id) => id as unknown as Id<"nodes">,
                      ),
                      currentNodeId: node._id,
                      nodeOutputs,
                      timestamp: Date.now(),
                    },
                  },
                );

                // Continue to abort case since notify usually includes abort
                success = false;
                error = `Error executing node ${node._id}: ${nodeError.message || "Unknown error"}`;
                break;

              case "abort":
              default:
                // Record node failure (standard case)
                await ctx.runMutation(
                  internal.integrations.scenarios.execution.recordNodeResult,
                  {
                    executionId: args.executionId,
                    nodeId: node._id,
                    status: "failed",
                    input: nodeInput || {},
                    output: null,
                    error: nodeError.message || "Unknown error",
                  },
                );

                // Save execution state before aborting
                await ctx.runMutation(
                  internal.integrations.scenarios.recovery
                    .saveExecutionCheckpoint,
                  {
                    executionId: args.executionId,
                    checkpoint: {
                      completedNodes: Array.from(completedNodes).map(
                        (id) => id as unknown as Id<"nodes">,
                      ),
                      currentNodeId: node._id,
                      nodeOutputs,
                      timestamp: Date.now(),
                    },
                  },
                );

                // Set execution to failed
                success = false;
                error = `Error executing node ${node._id}: ${nodeError.message || "Unknown error"}`;
                break;
            }
          } catch (handlingError) {
            // Fallback error handling if the error handling system itself fails
            console.error(`Error in error handling system:`, handlingError);

            // Record node failure with simple approach
            await ctx.runMutation(
              internal.integrations.scenarios.execution.recordNodeResult,
              {
                executionId: args.executionId,
                nodeId: node._id,
                status: "failed",
                input: nodeInput || {},
                output: null,
                error: nodeError.message || "Unknown error",
              },
            );

            // Update execution progress
            await ctx.runMutation(
              internal.integrations.scenarios.monitoring
                .updateExecutionNodeStats,
              {
                executionId: args.executionId,
              },
            );

            // Default to failure
            success = false;
            error = `Error executing node ${node._id}: ${nodeError.message || "Unknown error"}. Additional error in handling: ${handlingError.message}`;
          }
        }

        // Update execution progress after any node execution (success or failure)
        await ctx.runMutation(
          internal.integrations.scenarios.monitoring.updateExecutionProgress,
          {
            executionId: args.executionId,
            progress: (completedNodes.size / sortedNodes.length) * 100,
            currentNodeId: sortedNodes[currentIndex]?._id,
            estimatedTimeRemaining: calculateEstimatedTimeRemaining(
              startTime,
              completedNodes.size,
              sortedNodes.length,
            ),
          },
        );

        // If this was a completed node, move to the next
        if (completedNodes.has(nodeId)) {
          currentIndex++;
        }
      }

      // Record final execution result
      await ctx.runMutation(
        internal.integrations.scenarios.execution.recordExecutionResult,
        {
          executionId: args.executionId,
          success,
          error: error || undefined,
        },
      );

      // Update the scenario with last run information
      await ctx.runMutation(
        internal.integrations.scenarios.updateScenarioLastRun,
        {
          scenarioId: args.scenarioId,
          success,
          lastError: error || undefined,
        },
      );

      return { success, error: error || undefined };
    } catch (error) {
      // Record execution failure
      await ctx.runMutation(
        internal.integrations.scenarios.execution.recordExecutionResult,
        {
          executionId: args.executionId,
          success: false,
          error: error.message || "Unknown error",
        },
      );

      // Update the scenario with error information
      await ctx.runMutation(
        internal.integrations.scenarios.updateScenarioLastRun,
        {
          scenarioId: args.scenarioId,
          success: false,
          lastError: error.message || "Unknown error",
        },
      );

      return { success: false, error: error.message };
    }
  },
});

/**
 * Get execution by ID
 */
export const getExecutionById = internalQuery({
  args: {
    executionId: v.id("scenario_executions"),
  },
  returns: v.union(
    v.object({
      _id: v.id("scenario_executions"),
      scenarioId: v.id("scenarios"),
      startTime: v.number(),
      endTime: v.optional(v.number()),
      status: v.union(
        v.literal("running"),
        v.literal("completed"),
        v.literal("failed"),
      ),
      trigger: v.any(),
      nodeResults: v.array(v.any()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.executionId);
  },
});

/**
 * Record the start of a node execution
 */
export const recordNodeStart = internalMutation({
  args: {
    executionId: v.id("scenario_executions"),
    nodeId: v.id("nodes"),
    input: v.any(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Get the execution record
    const execution = await ctx.db.get(args.executionId);
    if (!execution) {
      return false;
    }

    // Check if this node is already in the results
    const existingIndex =
      execution.nodeResults?.findIndex(
        (result) => result.nodeId === args.nodeId,
      ) ?? -1;

    const nodeResult = {
      nodeId: args.nodeId,
      startTime: Date.now(),
      endTime: undefined,
      status: "running" as NodeExecutionStatus,
      input: args.input ?? {},
      output: undefined,
      error: undefined,
    };

    // Update the execution record
    if (existingIndex >= 0) {
      // Replace the existing result
      const updatedResults = [...(execution.nodeResults ?? [])];
      updatedResults[existingIndex] = nodeResult;

      await ctx.db.patch(args.executionId, {
        nodeResults: updatedResults,
      });
    } else {
      // Add a new result
      await ctx.db.patch(args.executionId, {
        nodeResults: [...(execution.nodeResults ?? []), nodeResult],
      });
    }

    return true;
  },
});

/**
 * Record the result of a node execution
 */
export const recordNodeResult = internalMutation({
  args: {
    executionId: v.id("scenario_executions"),
    nodeId: v.id("nodes"),
    status: v.union(
      v.literal("completed"),
      v.literal("failed"),
      v.literal("skipped"),
      v.literal("running"),
      v.literal("pending"),
    ),
    input: v.any(),
    output: v.optional(v.any()),
    error: v.optional(v.any()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Get the execution record
    const execution = await ctx.db.get(args.executionId);
    if (!execution) {
      return false;
    }

    // Check if this node is already in the results
    const existingIndex = execution.nodeResults.findIndex(
      (result) => result.nodeId === args.nodeId,
    );

    // Create the node result
    const nodeResult = {
      nodeId: args.nodeId,
      startTime:
        existingIndex >= 0
          ? execution.nodeResults[existingIndex].startTime
          : Date.now(),
      endTime: args.status !== "running" ? Date.now() : undefined,
      status: args.status,
      input: args.input ?? {},
      output: args.output ?? {},
      error: args.error,
    };

    // Update the execution record
    if (existingIndex >= 0) {
      // Replace the existing result
      const updatedResults = [...execution.nodeResults];
      updatedResults[existingIndex] = nodeResult;

      await ctx.db.patch(args.executionId, {
        nodeResults: updatedResults,
      });
    } else {
      // Add a new result
      await ctx.db.patch(args.executionId, {
        nodeResults: [...execution.nodeResults, nodeResult],
      });
    }

    // Calculate and update progress
    const totalNodes = execution.nodeResults.length;
    const completedNodes = execution.nodeResults.filter(
      (result) =>
        result.status === "completed" ||
        result.status === "failed" ||
        result.status === "skipped",
    ).length;

    // Add the current node if it's newly completed
    const adjustedCompletedNodes =
      (args.status === "completed" ||
        args.status === "failed" ||
        args.status === "skipped") &&
      (existingIndex < 0 ||
        execution.nodeResults[existingIndex].status === "running" ||
        execution.nodeResults[existingIndex].status === "pending")
        ? completedNodes + 1
        : completedNodes;

    const progress = Math.min(
      100,
      Math.round((adjustedCompletedNodes / (totalNodes || 1)) * 100),
    );

    // Update execution progress
    await ctx.db.patch(args.executionId, {
      progress,
      currentNodeId:
        args.status === "running" ? args.nodeId : execution.currentNodeId,
      lastUpdated: Date.now(),
    });

    return true;
  },
});

/**
 * Complete a scenario execution
 */
export const completeExecution = internalMutation({
  args: {
    executionId: v.id("scenario_executions"),
    status: v.union(v.literal("completed"), v.literal("failed")),
    output: v.optional(v.any()),
    error: v.optional(v.any()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Get the execution record
    const execution = await ctx.db.get(args.executionId);
    if (!execution) {
      return false;
    }

    // Update the execution record
    await ctx.db.patch(args.executionId, {
      status: args.status,
      endTime: Date.now(),
      ...(args.output ? { output: args.output } : {}),
      ...(args.error ? { error: args.error } : {}),
    });

    // If the execution failed, we may want to update the scenario status
    if (args.status === "failed") {
      // Get the scenario
      const scenario = await ctx.db.get(execution.scenarioId);
      if (scenario && scenario.status === "active") {
        // Check the error handling config
        const pauseOnError = scenario.errorHandling?.pauseOnError ?? false;

        if (pauseOnError) {
          // Pause the scenario
          await ctx.db.patch(execution.scenarioId, {
            status: "error" as ScenarioStatus,
            lastError: {
              timestamp: Date.now(),
              executionId: execution._id,
              message: args.error?.message || "Execution failed",
            },
          });
        }
      }
    }

    return true;
  },
});

/**
 * Execute an action node
 */
export const executeActionNode = internalAction({
  args: {
    executionId: v.id("scenario_executions"),
    scenarioId: v.id("scenarios"),
    nodeId: v.id("nodes"),
    input: v.any(),
    previousOutputs: v.any(),
    retryCount: v.number(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    try {
      // Get the node
      const node = await ctx.runQuery(
        internal.integrations.scenarios.nodes.getNodeById,
        { nodeId: args.nodeId },
      );

      if (!node) {
        throw new Error("Node not found");
      }

      // Verify the node type
      if (node.type !== "action") {
        throw new Error(`Expected node type 'action', but got '${node.type}'`);
      }

      // Get the app and operation details
      if (!node.appId) {
        throw new Error("Action node does not have an associated app");
      }

      const app = await ctx.runQuery(internal.integrations.apps.getAppById, {
        appId: node.appId,
      });

      if (!app) {
        throw new Error("App not found");
      }

      // Find the action definition
      const actionDef = app.actions.find(
        (action) => action.id === node.operation,
      );
      if (!actionDef) {
        throw new Error(
          `Action '${node.operation}' not found in app '${app.name}'`,
        );
      }

      // Get the connection
      if (!node.connectionId) {
        throw new Error("Action node does not have an associated connection");
      }

      const connection = await ctx.runQuery(
        internal.integrations.connections.getConnectionById,
        { connectionId: node.connectionId },
      );

      if (!connection) {
        throw new Error("Connection not found");
      }

      // Check if the connection is active
      if (connection.status !== "active") {
        throw new Error(
          `Connection is not active (status: ${connection.status})`,
        );
      }

      // Execute the action
      console.log(`Executing action '${actionDef.name}' for app '${app.name}'`);

      // In a real implementation, we would:
      // 1. Validate the input against the action's input schema
      // 2. Make an API call to the external service using the connection credentials
      // 3. Process the response and return it

      // For now, we'll simulate a successful response
      const output = {
        __status: "completed",
        success: true,
        timestamp: Date.now(),
        ...args.input, // Echo back the input for demonstration
        // Add some mock data that would come from the external service
        mockResponse: {
          id: `mock-${Date.now()}`,
          processed: true,
          serviceTimestamp: new Date().toISOString(),
        },
      };

      return output;
    } catch (error) {
      console.error("Error executing action node:", error);

      // Check if we should retry
      if (args.retryCount < MAX_RETRY_ATTEMPTS) {
        console.log(
          `Retrying action node execution (attempt ${args.retryCount + 1}/${MAX_RETRY_ATTEMPTS})`,
        );

        // Add exponential backoff
        const backoffMs = Math.pow(2, args.retryCount) * 1000;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));

        // Retry with incremented retry count
        return await ctx.runAction(
          internal.integrations.scenarios.execution.executeActionNode,
          {
            ...args,
            retryCount: args.retryCount + 1,
          },
        );
      }

      // Max retries exceeded, propagate the error
      throw error;
    }
  },
});

/**
 * Execute a transformer node
 */
export const executeTransformerNode = internalAction({
  args: {
    executionId: v.id("scenario_executions"),
    scenarioId: v.id("scenarios"),
    nodeId: v.id("nodes"),
    input: v.any(),
    previousOutputs: v.any(),
    retryCount: v.number(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    try {
      // Get the node
      const node = await ctx.runQuery(
        internal.integrations.scenarios.nodes.getNodeById,
        { nodeId: args.nodeId },
      );

      if (!node) {
        throw new Error("Node not found");
      }

      // Verify the node type
      if (node.type !== "transformer") {
        throw new Error(
          `Expected node type 'transformer', but got '${node.type}'`,
        );
      }

      // Get the transformer type and configuration
      const transformerType = node.operation;
      const config = node.config || {};

      // Execute the transformer based on its type
      let output = { __status: "completed" };

      switch (transformerType) {
        case "filter":
          // Filter properties from the input
          output = executeFilterTransformer(args.input, config);
          break;

        case "map":
          // Map properties from input to output
          output = executeMapTransformer(args.input, config);
          break;

        case "merge":
          // Merge multiple inputs
          output = executeMergeTransformer(
            args.input,
            args.previousOutputs,
            config,
          );
          break;

        case "convert":
          // Convert data types
          output = executeConvertTransformer(args.input, config);
          break;

        default:
          throw new Error(`Unknown transformer type: ${transformerType}`);
      }

      return output;
    } catch (error) {
      console.error("Error executing transformer node:", error);

      // Transformers typically don't need retries as they're deterministic,
      // but we'll implement it for consistency
      if (args.retryCount < 1) {
        console.log(
          `Retrying transformer node execution (attempt ${args.retryCount + 1}/1)`,
        );

        // Retry once
        return await ctx.runAction(
          internal.integrations.scenarios.execution.executeTransformerNode,
          {
            ...args,
            retryCount: args.retryCount + 1,
          },
        );
      }

      // Max retries exceeded, propagate the error
      throw error;
    }
  },
});

/**
 * Evaluate a condition node
 */
export const evaluateConditionNode = internalAction({
  args: {
    executionId: v.id("scenario_executions"),
    scenarioId: v.id("scenarios"),
    nodeId: v.id("nodes"),
    input: v.any(),
    previousOutputs: v.any(),
    retryCount: v.number(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    try {
      // Get the node
      const node = await ctx.runQuery(
        internal.integrations.scenarios.nodes.getNodeById,
        { nodeId: args.nodeId },
      );

      if (!node) {
        throw new Error("Node not found");
      }

      // Verify the node type
      if (node.type !== "condition") {
        throw new Error(
          `Expected node type 'condition', but got '${node.type}'`,
        );
      }

      // Get the conditions
      const conditions = node.conditions || [];
      if (conditions.length === 0) {
        // No conditions, always pass
        return {
          __status: "completed",
          result: true,
          message: "No conditions defined, automatically passed",
        };
      }

      // Evaluate each condition
      const results = conditions.map((condition) => {
        const { field, operator, value, combinator } = condition;

        // Get the field value from the input
        const fieldValue = field.includes(".")
          ? getNestedProperty(args.input, field)
          : args.input[field];

        // Evaluate the condition
        const result = evaluateCondition(fieldValue, operator, value);

        return {
          field,
          operator,
          expected: value,
          actual: fieldValue,
          result,
          combinator: combinator || "and",
        };
      });

      // Combine the results based on combinators
      let finalResult = true;
      let currentCombinator = "and";

      for (let i = 0; i < results.length; i++) {
        const result = results[i];

        if (i === 0) {
          // First result sets the initial value
          finalResult = result.result;
        } else {
          // Apply the previous combinator
          if (currentCombinator === "and") {
            finalResult = finalResult && result.result;
          } else if (currentCombinator === "or") {
            finalResult = finalResult || result.result;
          }
        }

        // Update the combinator for the next iteration
        if (i < results.length - 1) {
          currentCombinator = results[i].combinator;
        }
      }

      return {
        __status: "completed",
        result: finalResult,
        conditions: results,
        message: finalResult
          ? "All conditions passed"
          : "One or more conditions failed",
      };
    } catch (error) {
      console.error("Error evaluating condition node:", error);

      // Conditions typically don't need retries as they're deterministic,
      // but we'll implement it for consistency
      if (args.retryCount < 1) {
        console.log(
          `Retrying condition node evaluation (attempt ${args.retryCount + 1}/1)`,
        );

        // Retry once
        return await ctx.runAction(
          internal.integrations.scenarios.execution.evaluateConditionNode,
          {
            ...args,
            retryCount: args.retryCount + 1,
          },
        );
      }

      // Max retries exceeded, propagate the error
      throw error;
    }
  },
});

// Helper functions for transformers

function executeFilterTransformer(input: any, config: any) {
  const { include = [], exclude = [] } = config;
  const result: Record<string, any> = {};

  // Start with all properties if no includes specified
  if (include.length === 0) {
    Object.assign(result, input);

    // Remove excluded properties
    for (const key of exclude) {
      delete result[key];
    }
  } else {
    // Only include specified properties
    for (const key of include) {
      if (input[key] !== undefined) {
        result[key] = input[key];
      }
    }
  }

  return {
    __status: "completed",
    ...result,
  };
}

function executeMapTransformer(input: any, config: any) {
  const { mappings = {} } = config;
  const result: Record<string, any> = {};

  // Apply mappings
  for (const [targetKey, sourceKey] of Object.entries(mappings)) {
    if (typeof sourceKey === "string") {
      // Simple mapping
      result[targetKey] = input[sourceKey];
    } else if (typeof sourceKey === "object" && sourceKey.path) {
      // Nested property mapping
      result[targetKey] = getNestedProperty(input, sourceKey.path);
    }
  }

  return {
    __status: "completed",
    ...result,
  };
}

function executeMergeTransformer(
  input: any,
  previousOutputs: any,
  config: any,
) {
  const { sources = [] } = config;
  const result: Record<string, any> = { ...input };

  // Merge from additional sources
  for (const source of sources) {
    const sourceNodeId = source.nodeId;
    const sourceOutput = previousOutputs[sourceNodeId];

    if (sourceOutput) {
      // Merge properties
      for (const key of Object.keys(sourceOutput)) {
        if (key !== "__status" && key !== "__error") {
          result[key] = sourceOutput[key];
        }
      }
    }
  }

  return {
    __status: "completed",
    ...result,
  };
}

function executeConvertTransformer(input: any, config: any) {
  const { conversions = [] } = config;
  const result: Record<string, any> = { ...input };

  // Apply conversions
  for (const conversion of conversions) {
    const { field, type } = conversion;

    if (result[field] !== undefined) {
      switch (type) {
        case "string":
          result[field] = String(result[field]);
          break;

        case "number":
          result[field] = Number(result[field]);
          break;

        case "boolean":
          result[field] = Boolean(result[field]);
          break;

        case "date":
          result[field] = new Date(result[field]).toISOString();
          break;

        case "json":
          if (typeof result[field] === "string") {
            try {
              result[field] = JSON.parse(result[field]);
            } catch (e) {
              // Leave as is if parsing fails
            }
          }
          break;
      }
    }
  }

  return {
    __status: "completed",
    ...result,
  };
}

// Helper functions for conditions

function getNestedProperty(obj: any, path: string) {
  const parts = path.split(".");
  let current = obj;

  for (const part of parts) {
    if (current === undefined || current === null) {
      return undefined;
    }

    current = current[part];
  }

  return current;
}

function evaluateCondition(actual: any, operator: string, expected: any) {
  switch (operator) {
    case "eq":
      return actual == expected;

    case "neq":
      return actual != expected;

    case "gt":
      return actual > expected;

    case "gte":
      return actual >= expected;

    case "lt":
      return actual < expected;

    case "lte":
      return actual <= expected;

    case "contains":
      if (typeof actual === "string") {
        return actual.includes(String(expected));
      } else if (Array.isArray(actual)) {
        return actual.includes(expected);
      }
      return false;

    case "startsWith":
      return typeof actual === "string" && actual.startsWith(String(expected));

    case "endsWith":
      return typeof actual === "string" && actual.endsWith(String(expected));

    case "empty":
      return (
        actual === undefined ||
        actual === null ||
        actual === "" ||
        (Array.isArray(actual) && actual.length === 0) ||
        (typeof actual === "object" && Object.keys(actual).length === 0)
      );

    case "notEmpty":
      return !evaluateCondition(actual, "empty", expected);

    default:
      throw new Error(`Unknown operator: ${operator}`);
  }
}

/**
 * Get all executions for a scenario
 */
export const getScenarioExecutions = query({
  args: {
    scenarioId: v.id("scenarios"),
    limit: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("running"),
        v.literal("completed"),
        v.literal("failed"),
      ),
    ),
  },
  returns: v.array(
    v.object({
      _id: v.id("scenario_executions"),
      _creationTime: v.number(),
      scenarioId: v.id("scenarios"),
      startTime: v.number(),
      endTime: v.optional(v.number()),
      status: v.string(),
      trigger: v.any(),
      duration: v.optional(v.number()),
      nodeStats: v.object({
        total: v.number(),
        completed: v.number(),
        failed: v.number(),
        skipped: v.number(),
        running: v.number(),
        pending: v.number(),
      }),
    }),
  ),
  handler: async (ctx, args) => {
    // Get the user ID
    const userId = await getOptionalUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get the scenario
    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario) {
      return [];
    }

    // Check if the user has access to this scenario
    if (scenario.createdBy !== userId) {
      return [];
    }

    // Start building the query
    let query = ctx.db
      .query("scenario_executions")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.scenarioId));

    // Apply status filter if provided
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    // Order by start time descending
    query = query.order("desc").take(args.limit || 10);

    // Execute the query
    const executions = await query.collect();

    // Calculate duration and node stats for each execution
    return executions.map((execution) => {
      const duration = execution.endTime
        ? execution.endTime - execution.startTime
        : undefined;

      // Calculate node stats
      const nodeStats = {
        total: execution.nodeResults.length,
        completed: 0,
        failed: 0,
        skipped: 0,
        running: 0,
        pending: 0,
      };

      for (const nodeResult of execution.nodeResults) {
        switch (nodeResult.status) {
          case "completed":
            nodeStats.completed++;
            break;
          case "failed":
            nodeStats.failed++;
            break;
          case "skipped":
            nodeStats.skipped++;
            break;
          case "running":
            nodeStats.running++;
            break;
          case "pending":
            nodeStats.pending++;
            break;
        }
      }

      return {
        _id: execution._id,
        _creationTime: execution._creationTime,
        scenarioId: execution.scenarioId,
        startTime: execution.startTime,
        endTime: execution.endTime,
        status: execution.status,
        trigger: execution.trigger,
        duration,
        nodeStats,
      };
    });
  },
});

/**
 * Get detailed information about a specific execution
 */
export const getExecutionDetails = query({
  args: {
    executionId: v.id("scenario_executions"),
  },
  returns: v.union(
    v.object({
      _id: v.id("scenario_executions"),
      _creationTime: v.number(),
      scenarioId: v.id("scenarios"),
      startTime: v.number(),
      endTime: v.optional(v.number()),
      status: v.string(),
      trigger: v.any(),
      duration: v.optional(v.number()),
      nodeResults: v.array(v.any()),
      error: v.optional(v.any()),
      output: v.optional(v.any()),
      scenario: v.object({
        _id: v.id("scenarios"),
        name: v.string(),
        description: v.string(),
      }),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    // Get the user ID
    const userId = await getOptionalUserId(ctx);
    if (!userId) {
      return null;
    }

    // Get the execution
    const execution = await ctx.db.get(args.executionId);
    if (!execution) {
      return null;
    }

    // Get the scenario
    const scenario = await ctx.db.get(execution.scenarioId);
    if (!scenario) {
      return null;
    }

    // Check if the user has access to this scenario
    if (scenario.createdBy !== userId) {
      return null;
    }

    // Calculate duration
    const duration = execution.endTime
      ? execution.endTime - execution.startTime
      : undefined;

    // Return detailed execution information
    return {
      _id: execution._id,
      _creationTime: execution._creationTime,
      scenarioId: execution.scenarioId,
      startTime: execution.startTime,
      endTime: execution.endTime,
      status: execution.status,
      trigger: execution.trigger,
      duration,
      nodeResults: execution.nodeResults,
      error: execution.error,
      output: execution.output,
      scenario: {
        _id: scenario._id,
        name: scenario.name,
        description: scenario.description,
      },
    };
  },
});

/**
 * Record the result of a scenario execution
 */
export const recordExecutionResult = internalMutation({
  args: {
    executionId: v.id("scenario_executions"),
    success: v.boolean(),
    error: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Get the execution record
    const execution = await ctx.db.get(args.executionId);
    if (!execution) {
      return false;
    }

    // Update the execution record
    await ctx.db.patch(args.executionId, {
      endTime: Date.now(),
      status: args.success ? "completed" : "failed",
    });

    // If there was an error, log it
    if (!args.success && args.error) {
      await logExecutionAuditEvent(ctx, {
        event: "execution_failed",
        userId: null,
        scenarioId: execution.scenarioId,
        executionId: args.executionId,
        details: {
          error: args.error,
        },
      });
    }

    return true;
  },
});

/**
 * Get active executions
 *
 * Returns a list of currently running scenario executions
 */
export const getActiveExecutions = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("scenario_executions"),
      _creationTime: v.number(),
      scenarioId: v.id("scenarios"),
      startTime: v.number(),
      status: v.literal("running"),
      trigger: v.any(),
      duration: v.number(),
      elapsedTime: v.number(),
      progress: v.number(),
      nodeStats: v.object({
        total: v.number(),
        completed: v.number(),
        failed: v.number(),
        skipped: v.number(),
        running: v.number(),
        pending: v.number(),
      }),
      scenario: v.object({
        _id: v.id("scenarios"),
        name: v.string(),
      }),
    }),
  ),
  handler: async (ctx, args) => {
    // Get the user ID
    const userId = await getOptionalUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get all active executions
    const activeExecutions = await ctx.db
      .query("scenario_executions")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .order("desc")
      .take(args.limit || 10);

    // Filter out executions the user doesn't have access to
    const executionsWithAccess = [];

    for (const execution of activeExecutions) {
      // Get the scenario
      const scenario = await ctx.db.get(execution.scenarioId);
      if (!scenario) continue;

      // Check if the user has access to this scenario
      if (scenario.createdBy !== userId) continue;

      // Calculate current duration
      const currentTime = Date.now();
      const duration = currentTime - execution.startTime;

      // Calculate node stats
      const nodeStats = {
        total: execution.nodeResults.length,
        completed: 0,
        failed: 0,
        skipped: 0,
        running: 0,
        pending: 0,
      };

      for (const nodeResult of execution.nodeResults) {
        switch (nodeResult.status) {
          case "completed":
            nodeStats.completed++;
            break;
          case "failed":
            nodeStats.failed++;
            break;
          case "skipped":
            nodeStats.skipped++;
            break;
          case "running":
            nodeStats.running++;
            break;
          default:
            nodeStats.pending++;
            break;
        }
      }

      // Calculate progress percentage
      const totalNodes = nodeStats.total || 1; // Avoid division by zero
      const completedNodes =
        nodeStats.completed + nodeStats.failed + nodeStats.skipped;
      const progress = Math.min(
        100,
        Math.round((completedNodes / totalNodes) * 100),
      );

      executionsWithAccess.push({
        _id: execution._id,
        _creationTime: execution._creationTime,
        scenarioId: execution.scenarioId,
        startTime: execution.startTime,
        status: "running" as const,
        trigger: execution.trigger,
        duration,
        elapsedTime: currentTime,
        progress,
        nodeStats,
        scenario: {
          _id: scenario._id,
          name: scenario.name,
        },
      });
    }

    return executionsWithAccess;
  },
});

/**
 * Record execution progress
 *
 * Internal function to update the execution progress
 */
export const recordExecutionProgress = internalMutation({
  args: {
    executionId: v.id("scenario_executions"),
    progress: v.number(),
    currentNodeId: v.optional(v.id("nodes")),
    estimatedTimeRemaining: v.optional(v.number()),
    metrics: v.optional(v.any()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Get the execution record
    const execution = await ctx.db.get(args.executionId);
    if (!execution) {
      return false;
    }

    // Only update if the execution is still running
    if (execution.status !== "running") {
      return false;
    }

    // Update the execution record with monitoring information
    await ctx.db.patch(args.executionId, {
      progress: args.progress,
      currentNodeId: args.currentNodeId,
      estimatedTimeRemaining: args.estimatedTimeRemaining,
      metrics: args.metrics,
      lastUpdated: Date.now(),
    });

    return true;
  },
});

/**
 * Subscribe to execution updates
 *
 * Returns a subscription that will be updated whenever the execution status changes
 */
export const subscribeToExecution = query({
  args: {
    executionId: v.id("scenario_executions"),
  },
  returns: v.union(
    v.object({
      _id: v.id("scenario_executions"),
      scenarioId: v.id("scenarios"),
      status: v.string(),
      progress: v.optional(v.number()),
      currentNodeId: v.optional(v.id("nodes")),
      startTime: v.number(),
      endTime: v.optional(v.number()),
      lastUpdated: v.optional(v.number()),
      nodeStats: v.object({
        total: v.number(),
        completed: v.number(),
        failed: v.number(),
        skipped: v.number(),
        running: v.number(),
        pending: v.number(),
      }),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    // Get the user ID
    const userId = await getOptionalUserId(ctx);
    if (!userId) {
      return null;
    }

    // Get the execution
    const execution = await ctx.db.get(args.executionId);
    if (!execution) {
      return null;
    }

    // Get the scenario
    const scenario = await ctx.db.get(execution.scenarioId);
    if (!scenario) {
      return null;
    }

    // Check if the user has access to this scenario
    if (scenario.createdBy !== userId) {
      return null;
    }

    // Calculate node stats
    const nodeStats = {
      total: execution.nodeResults.length,
      completed: 0,
      failed: 0,
      skipped: 0,
      running: 0,
      pending: 0,
    };

    for (const nodeResult of execution.nodeResults) {
      switch (nodeResult.status) {
        case "completed":
          nodeStats.completed++;
          break;
        case "failed":
          nodeStats.failed++;
          break;
        case "skipped":
          nodeStats.skipped++;
          break;
        case "running":
          nodeStats.running++;
          break;
        default:
          nodeStats.pending++;
          break;
      }
    }

    // Return execution status information
    return {
      _id: execution._id,
      scenarioId: execution.scenarioId,
      status: execution.status,
      progress: execution.progress,
      currentNodeId: execution.currentNodeId,
      startTime: execution.startTime,
      endTime: execution.endTime,
      lastUpdated: execution.lastUpdated,
      nodeStats,
    };
  },
});

/**
 * Optimized function for batched node execution
 *
 * This function improves performance by:
 * 1. Prefetching all required data in a single batch
 * 2. Minimizing database operations
 * 3. Using caching for expensive operations
 */
export const optimizedExecuteScenario = internalAction({
  args: {
    executionId: v.id("scenario_executions"),
    scenarioId: v.id("scenarios"),
    userId: v.id("users"),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get all required data in a single batch
      const [execution, scenario, nodes, connections] = await Promise.all([
        ctx.runQuery(
          internal.integrations.scenarios.execution.getExecutionById,
          {
            executionId: args.executionId,
          },
        ),
        ctx.runQuery(internal.integrations.scenarios.getScenarioById, {
          scenarioId: args.scenarioId,
        }),
        ctx.runQuery(internal.integrations.scenarios.getScenarioNodes, {
          scenarioId: args.scenarioId,
        }),
        ctx.runQuery(internal.integrations.connections.listUserConnections, {
          userId: args.userId,
        }),
      ]);

      if (!execution) {
        throw new Error("Execution not found");
      }

      if (!scenario) {
        throw new Error("Scenario not found");
      }

      if (nodes.length === 0) {
        await ctx.runMutation(
          internal.integrations.scenarios.execution.recordExecutionResult,
          {
            executionId: args.executionId,
            success: true,
            error: "No nodes to execute",
          },
        );
        return { success: true };
      }

      // Create a connections lookup map for faster access
      const connectionsMap = new Map();
      for (const connection of connections) {
        connectionsMap.set(connection._id.toString(), connection);
      }

      // Create a dependency graph for execution order
      const nodeMap = new Map();
      const nodeDependencies = new Map();

      // Sort nodes by position for initial order
      nodes.sort((a, b) => a.position - b.position);

      // Build node maps
      for (const node of nodes) {
        nodeMap.set(node._id.toString(), node);
        nodeDependencies.set(node._id.toString(), []);
      }

      // Identify dependencies between nodes
      for (const node of nodes) {
        if (node.dependsOn && node.dependsOn.length > 0) {
          for (const dependencyId of node.dependsOn) {
            const dependsList = nodeDependencies.get(node._id.toString()) || [];
            dependsList.push(dependencyId.toString());
            nodeDependencies.set(node._id.toString(), dependsList);
          }
        }
      }

      // Execute each node in sequence
      const nodeOutputs: Record<string, Record<string, unknown>> = {};
      let success = true;
      let error = "";

      // Track completed nodes for dependency resolution
      const completedNodes = new Set<string>();
      const nodesToExecute = [...nodes];
      let currentIndex = 0;

      // Process nodes with proper dependency handling
      while (nodesToExecute.length > currentIndex) {
        const node = nodesToExecute[currentIndex];
        const nodeId = node._id.toString();
        const dependencies = nodeDependencies.get(nodeId) || [];

        // Check if all dependencies are completed
        const allDependenciesMet = dependencies.every((depId) =>
          completedNodes.has(depId),
        );

        if (!allDependenciesMet) {
          // Move this node to the end of the queue
          nodesToExecute.push(node);
          currentIndex++;
          continue;
        }

        // Calculate progress percentage
        const progress = Math.round((completedNodes.size / nodes.length) * 100);

        // Update execution progress
        await ctx.runMutation(
          internal.integrations.scenarios.execution.recordExecutionProgress,
          {
            executionId: args.executionId,
            progress,
            currentNodeId: node._id,
            estimatedTimeRemaining: (nodes.length - completedNodes.size) * 5000, // Rough estimate
          },
        );

        // Execute the node based on its type
        try {
          let nodeResult;
          const nodeInput = await prepareNodeInput(node, nodeOutputs);

          // Record node execution start
          await ctx.runMutation(
            internal.integrations.scenarios.execution.recordNodeStart,
            {
              executionId: args.executionId,
              nodeId: node._id,
              input: nodeInput,
            },
          );

          switch (node.type) {
            case "action":
              nodeResult = await executeActionNode(ctx, {
                node,
                input: nodeInput,
                connections: connectionsMap,
                previousOutputs: nodeOutputs,
                executionId: args.executionId,
                scenarioId: args.scenarioId,
                retryCount: 0,
              });
              break;

            case "transformer":
              nodeResult = await executeTransformerNode(ctx, {
                node,
                input: nodeInput,
                previousOutputs: nodeOutputs,
                executionId: args.executionId,
                scenarioId: args.scenarioId,
              });
              break;

            case "condition":
              nodeResult = await evaluateConditionNode(ctx, {
                node,
                input: nodeInput,
                previousOutputs: nodeOutputs,
                executionId: args.executionId,
                scenarioId: args.scenarioId,
              });
              break;

            default:
              throw new Error(`Unknown node type: ${node.type}`);
          }

          // Store node output
          nodeOutputs[node._id.toString()] = nodeResult.output || {};

          // Record node result
          await ctx.runMutation(
            internal.integrations.scenarios.execution.recordNodeResult,
            {
              executionId: args.executionId,
              nodeId: node._id,
              status: "completed",
              input: nodeInput,
              output: nodeResult.output,
              error: nodeResult.error,
            },
          );

          // If this is a condition node that evaluated to false,
          // mark dependent nodes as skipped
          if (
            node.type === "condition" &&
            nodeResult.success &&
            nodeResult.output?.result === false
          ) {
            // Find nodes that depend on this condition
            const affectedNodes = nodes.filter(
              (n) => n.dependsOn && n.dependsOn.includes(node._id),
            );

            // Mark them as skipped
            for (const affectedNode of affectedNodes) {
              await ctx.runMutation(
                internal.integrations.scenarios.execution.recordNodeSkipped,
                {
                  executionId: args.executionId,
                  nodeId: affectedNode._id,
                  conditionNodeId: node._id,
                },
              );

              // Add to completed nodes so we don't try to execute them
              completedNodes.add(affectedNode._id.toString());
            }
          }
        } catch (nodeError) {
          console.error(`Error executing node ${node._id}:`, nodeError);

          try {
            // Classify the error
            const errorClassification = await ctx.runAction(
              internal.integrations.scenarios.errorHandling.classifyError,
              { error: nodeError },
            );

            // Log the error event with classification details
            await ctx.runMutation(
              internal.integrations.scenarios.monitoring.logExecutionEvent,
              {
                executionId: args.executionId,
                eventType: "node_failed",
                nodeId: node._id,
                details: {
                  errorMessage: nodeError.message || "Unknown error",
                  errorClassification,
                  timestamp: Date.now(),
                },
                level: "error",
              },
            );

            // Get recommended recovery action
            const context = {
              isEssentialNode: node.config?.essential === true,
              nodeType: node.type,
            };

            // Determine retry attempts made so far
            const retryAttempt =
              nodeOutputs[node._id.toString()]?.retryCount || 0;

            const recoveryAction = await ctx.runAction(
              internal.integrations.scenarios.errorHandling.getRecoveryAction,
              {
                errorClassification,
                retryAttempt,
                nodeType: node.type,
                context,
              },
            );

            // Handle recovery action
            switch (recoveryAction.action) {
              case "retry":
                // Save checkpoint before retry
                await ctx.runMutation(
                  internal.integrations.scenarios.recovery
                    .saveExecutionCheckpoint,
                  {
                    executionId: args.executionId,
                    checkpoint: {
                      completedNodes: Array.from(completedNodes).map(
                        (id) => id as unknown as Id<"nodes">,
                      ),
                      currentNodeId: node._id,
                      nodeOutputs,
                      timestamp: Date.now(),
                    },
                  },
                );

                // Update retry count
                await ctx.runMutation(
                  internal.integrations.scenarios.execution
                    .updateExecutionRetryCount,
                  {
                    executionId: args.executionId,
                    nodeId: node._id,
                    retryCount: retryAttempt + 1,
                    maxRetries:
                      scenario.errorHandling?.retryCount || MAX_RETRY_ATTEMPTS,
                    lastRetryTime: Date.now(),
                  },
                );

                // Log retry attempt
                await ctx.runMutation(
                  internal.integrations.scenarios.monitoring.logExecutionEvent,
                  {
                    executionId: args.executionId,
                    eventType: "retry_attempted",
                    nodeId: node._id,
                    details: {
                      attempt: retryAttempt + 1,
                      maxRetries:
                        scenario.errorHandling?.retryCount ||
                        MAX_RETRY_ATTEMPTS,
                      delay: recoveryAction.delay,
                      reason: recoveryAction.reason,
                    },
                    level: "warning",
                  },
                );

                // Store retry info in node outputs
                nodeOutputs[node._id.toString()] = {
                  ...nodeOutputs[node._id.toString()],
                  retryCount: retryAttempt + 1,
                  lastRetryTime: Date.now(),
                };

                // Don't mark as completed, we'll retry on next iteration
                currentIndex--; // Re-run this node

                // If a delay is recommended, wait before retrying
                if (recoveryAction.delay) {
                  await new Promise((resolve) =>
                    setTimeout(resolve, recoveryAction.delay),
                  );
                }
                break;

              case "skip":
                // Record node as skipped after failure
                await ctx.runMutation(
                  internal.integrations.scenarios.execution.recordNodeResult,
                  {
                    executionId: args.executionId,
                    nodeId: node._id,
                    status: "skipped",
                    input: nodeInput || {},
                    output: null,
                    error: nodeError.message || "Unknown error",
                  },
                );

                // Log skip action
                await ctx.runMutation(
                  internal.integrations.scenarios.monitoring.logExecutionEvent,
                  {
                    executionId: args.executionId,
                    eventType: "node_skipped",
                    nodeId: node._id,
                    details: {
                      reason: recoveryAction.reason,
                      errorClassification,
                    },
                    level: "warning",
                  },
                );

                // Mark as completed so we move to the next node
                completedNodes.add(nodeId);
                break;

              case "fallback":
                // Use fallback value
                nodeOutputs[node._id.toString()] = {
                  ...nodeOutputs[node._id.toString()],
                  ...recoveryAction.fallbackValue,
                  _usedFallback: true,
                };

                // Record node as completed with fallback
                await ctx.runMutation(
                  internal.integrations.scenarios.execution.recordNodeResult,
                  {
                    executionId: args.executionId,
                    nodeId: node._id,
                    status: "completed",
                    input: nodeInput || {},
                    output: recoveryAction.fallbackValue,
                    error: {
                      message: nodeError.message || "Unknown error",
                      usedFallback: true,
                    },
                  },
                );

                // Log fallback usage
                await ctx.runMutation(
                  internal.integrations.scenarios.monitoring.logExecutionEvent,
                  {
                    executionId: args.executionId,
                    eventType: "fallback_used",
                    nodeId: node._id,
                    details: {
                      fallbackValue: recoveryAction.fallbackValue,
                      reason: recoveryAction.reason,
                    },
                    level: "info",
                  },
                );

                // Mark as completed so we move to the next node
                completedNodes.add(nodeId);
                break;

              case "notify":
                // Send notification (if configured)
                if (scenario.errorHandling?.notifyOnError) {
                  const formattedError = await ctx.runAction(
                    internal.integrations.scenarios.errorHandling
                      .formatErrorForDisplay,
                    {
                      error: nodeError,
                      errorClassification,
                      context: {
                        nodeId: node._id,
                        nodeType: node.type,
                        scenarioId: args.scenarioId,
                        executionId: args.executionId,
                      },
                    },
                  );

                  await ctx.runAction(
                    internal.integrations.scenarios.notifications
                      .sendNotification,
                    {
                      userId: userId,
                      title: formattedError.title,
                      message: formattedError.message,
                      details: formattedError.details || "",
                      resourceType: "scenario_execution",
                      resourceId: args.executionId,
                      category: "error",
                      priority: "high",
                    },
                  );
                }

                // Record node failure
                await ctx.runMutation(
                  internal.integrations.scenarios.execution.recordNodeResult,
                  {
                    executionId: args.executionId,
                    nodeId: node._id,
                    status: "failed",
                    input: nodeInput || {},
                    output: null,
                    error: nodeError.message || "Unknown error",
                  },
                );

                // Save execution state before aborting
                await ctx.runMutation(
                  internal.integrations.scenarios.recovery
                    .saveExecutionCheckpoint,
                  {
                    executionId: args.executionId,
                    checkpoint: {
                      completedNodes: Array.from(completedNodes).map(
                        (id) => id as unknown as Id<"nodes">,
                      ),
                      currentNodeId: node._id,
                      nodeOutputs,
                      timestamp: Date.now(),
                    },
                  },
                );

                // Continue to abort case since notify usually includes abort
                success = false;
                error = `Error executing node ${node._id}: ${nodeError.message || "Unknown error"}`;
                break;

              case "abort":
              default:
                // Record node failure (standard case)
                await ctx.runMutation(
                  internal.integrations.scenarios.execution.recordNodeResult,
                  {
                    executionId: args.executionId,
                    nodeId: node._id,
                    status: "failed",
                    input: nodeInput || {},
                    output: null,
                    error: nodeError.message || "Unknown error",
                  },
                );

                // Save execution state before aborting
                await ctx.runMutation(
                  internal.integrations.scenarios.recovery
                    .saveExecutionCheckpoint,
                  {
                    executionId: args.executionId,
                    checkpoint: {
                      completedNodes: Array.from(completedNodes).map(
                        (id) => id as unknown as Id<"nodes">,
                      ),
                      currentNodeId: node._id,
                      nodeOutputs,
                      timestamp: Date.now(),
                    },
                  },
                );

                // Set execution to failed
                success = false;
                error = `Error executing node ${node._id}: ${nodeError.message || "Unknown error"}`;
                break;
            }
          } catch (handlingError) {
            // Fallback error handling if the error handling system itself fails
            console.error(`Error in error handling system:`, handlingError);

            // Record node failure with simple approach
            await ctx.runMutation(
              internal.integrations.scenarios.execution.recordNodeResult,
              {
                executionId: args.executionId,
                nodeId: node._id,
                status: "failed",
                input: nodeInput || {},
                output: null,
                error: nodeError.message || "Unknown error",
              },
            );

            // Update execution progress
            await ctx.runMutation(
              internal.integrations.scenarios.monitoring
                .updateExecutionNodeStats,
              {
                executionId: args.executionId,
              },
            );

            // Default to failure
            success = false;
            error = `Error executing node ${node._id}: ${nodeError.message || "Unknown error"}. Additional error in handling: ${handlingError.message}`;
          }
        }

        // Update execution progress after any node execution (success or failure)
        await ctx.runMutation(
          internal.integrations.scenarios.monitoring.updateExecutionProgress,
          {
            executionId: args.executionId,
            progress: (completedNodes.size / sortedNodes.length) * 100,
            currentNodeId: sortedNodes[currentIndex]?._id,
            estimatedTimeRemaining: calculateEstimatedTimeRemaining(
              startTime,
              completedNodes.size,
              sortedNodes.length,
            ),
          },
        );

        // If this was a completed node, move to the next
        if (completedNodes.has(nodeId)) {
          currentIndex++;
        }
      }

      // Record final execution result
      await ctx.runMutation(
        internal.integrations.scenarios.execution.recordExecutionResult,
        {
          executionId: args.executionId,
          success,
          error: error || undefined,
        },
      );

      // Update the scenario with last run information
      await ctx.runMutation(
        internal.integrations.scenarios.updateScenarioLastRun,
        {
          scenarioId: args.scenarioId,
          success,
          lastError: error || undefined,
        },
      );

      return { success, error: error || undefined };
    } catch (error) {
      // Record execution failure
      await ctx.runMutation(
        internal.integrations.scenarios.execution.recordExecutionResult,
        {
          executionId: args.executionId,
          success: false,
          error: error.message || "Unknown error",
        },
      );

      // Update the scenario with error information
      await ctx.runMutation(
        internal.integrations.scenarios.updateScenarioLastRun,
        {
          scenarioId: args.scenarioId,
          success: false,
          lastError: error.message || "Unknown error",
        },
      );

      return { success: false, error: error.message };
    }
  },
});

/**
 * Record a node as skipped due to a condition evaluation
 */
export const recordNodeSkipped = internalMutation({
  args: {
    executionId: v.id("scenario_executions"),
    nodeId: v.id("nodes"),
    conditionNodeId: v.id("nodes"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Get the execution record
    const execution = await ctx.db.get(args.executionId);
    if (!execution) {
      return false;
    }

    // Create a node result for the skipped node
    const nodeResult = {
      nodeId: args.nodeId,
      startTime: Date.now(),
      endTime: Date.now(), // Same as start time since it was skipped
      status: "skipped" as const,
      input: {},
      output: {
        skipped: true,
        reason: `Condition ${args.conditionNodeId} evaluated to false`,
      },
      error: undefined,
    };

    // Add the result to the execution record
    await ctx.db.patch(args.executionId, {
      nodeResults: [...(execution.nodeResults || []), nodeResult],
    });

    return true;
  },
});

/**
 * Helper function to prepare input for a node with optimized data mapping
 */
async function prepareNodeInput(
  node: any,
  previousOutputs: Record<string, Record<string, unknown>>,
): Promise<Record<string, unknown>> {
  const input: Record<string, unknown> = {};

  // Process input mappings efficiently
  if (node.inputMappings && node.inputMappings.length > 0) {
    // Group mappings by source node for batch processing
    const mappingsBySource = new Map<
      string,
      Array<{ source: string; target: string }>
    >();

    for (const mapping of node.inputMappings) {
      if (!mapping.source || !mapping.target) continue;

      const [sourceNodeId, sourceProperty] = mapping.source.split(".");
      if (!sourceNodeId || !sourceProperty) continue;

      // Get or create the list for this source node
      const mappings = mappingsBySource.get(sourceNodeId) || [];
      mappings.push({
        source: sourceProperty,
        target: mapping.target,
      });
      mappingsBySource.set(sourceNodeId, mappings);
    }

    // Process each source node's outputs once
    for (const [sourceNodeId, mappings] of mappingsBySource.entries()) {
      const sourceOutput = previousOutputs[sourceNodeId] || {};

      // Apply all mappings from this source node
      for (const mapping of mappings) {
        input[mapping.target] = getNestedProperty(sourceOutput, mapping.source);
      }
    }
  }

  // Apply static inputs (overriding mapped inputs if same property name)
  if (node.staticInputs) {
    Object.assign(input, node.staticInputs);
  }

  return input;
}

/**
 * Retry a failed node execution
 */
export const retryNodeExecution = internalAction({
  args: {
    nodeId: v.id("nodes"),
    executionId: v.id("scenario_executions"),
    scenarioId: v.id("scenarios"),
    retryCount: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      console.log(
        `Retrying node ${args.nodeId} in execution ${args.executionId} (${args.retryCount} attempts remaining)`,
      );

      // Get the execution record
      const execution = await ctx.runQuery(
        internal.integrations.scenarios.getExecution,
        { executionId: args.executionId },
      );

      if (!execution) {
        throw new Error(`Execution ${args.executionId} not found`);
      }

      // Check if the execution is still running
      if (execution.status !== "running") {
        throw new Error(
          `Cannot retry node in execution with status: ${execution.status}`,
        );
      }

      // Get the node
      const node = await ctx.runQuery(internal.integrations.scenarios.getNode, {
        nodeId: args.nodeId,
      });

      if (!node) {
        throw new Error(`Node ${args.nodeId} not found`);
      }

      // Get the previous outputs from other nodes
      const previousOutputs = await ctx.runQuery(
        internal.integrations.scenarios.getExecutionOutputs,
        { executionId: args.executionId },
      );

      // Log the retry attempt
      await ctx.runMutation(
        internal.integrations.scenarios.monitoring.logExecutionEvent,
        {
          executionId: args.executionId,
          eventType: "node_retry_started",
          nodeId: args.nodeId,
          details: {
            retryCount: args.retryCount,
            timestamp: Date.now(),
          },
        },
      );

      // Record the retry in the execution record
      await ctx.runMutation(
        internal.integrations.scenarios.monitoring.updateNodeExecutionStatus,
        {
          executionId: args.executionId,
          nodeId: args.nodeId,
          status: "running",
          details: {
            retryAttempt: args.retryCount,
            retryTimestamp: Date.now(),
          },
        },
      );

      // Prepare the input for the node
      const input = await prepareNodeInput(node, previousOutputs);

      // Execute the node
      const result = await executeNode(ctx, {
        nodeId: args.nodeId,
        scenarioId: args.scenarioId,
        executionId: args.executionId,
        input,
        retryCount: args.retryCount,
      });

      // Record the successful retry
      await ctx.runMutation(
        internal.integrations.scenarios.retryManager.recordSuccessfulAttempt,
        {
          nodeId: args.nodeId.toString(),
          executionId: args.executionId.toString(),
        },
      );

      // Continue the execution if the node completed successfully
      if (result.status === "completed") {
        await ctx.runAction(
          internal.integrations.scenarios.execution.continueExecution,
          {
            executionId: args.executionId,
            scenarioId: args.scenarioId,
            lastCompletedNodeId: args.nodeId,
          },
        );
      }

      return {
        success: result.status === "completed",
        nodeId: args.nodeId,
        status: result.status,
      };
    } catch (error) {
      console.error(`Error retrying node execution:`, error);

      // Log the retry failure
      await ctx.runMutation(
        internal.integrations.scenarios.monitoring.logExecutionEvent,
        {
          executionId: args.executionId,
          eventType: "node_retry_failed",
          nodeId: args.nodeId,
          details: {
            error: error instanceof Error ? error.message : String(error),
            retryCount: args.retryCount,
            timestamp: Date.now(),
          },
        },
      );

      // Update the node status to failed
      await ctx.runMutation(
        internal.integrations.scenarios.monitoring.updateNodeExecutionStatus,
        {
          executionId: args.executionId,
          nodeId: args.nodeId,
          status: "failed",
          details: {
            error: error instanceof Error ? error.message : String(error),
            retryAttempt: args.retryCount,
            retryTimestamp: Date.now(),
          },
        },
      );

      // Get the scenario to determine error handling configuration
      const scenario = await ctx.runQuery(
        internal.integrations.scenarios.getScenario,
        { scenarioId: args.scenarioId },
      );

      // Check if we should schedule another retry
      if (args.retryCount > 0 && scenario) {
        const retryConfig = scenario.errorHandling?.retryConfig;

        // Attempt to schedule another retry
        const { scheduled } = await ctx.runAction(
          internal.integrations.scenarios.retryManager.scheduleRetry,
          {
            nodeId: args.nodeId,
            executionId: args.executionId,
            scenarioId: args.scenarioId,
            error,
            retryConfig,
          },
        );

        if (scheduled) {
          return {
            success: false,
            nodeId: args.nodeId,
            status: "pending",
            retryScheduled: true,
          };
        }
      }

      // If we can't retry again, fail the execution
      await ctx.runAction(
        internal.integrations.scenarios.execution.failExecution,
        {
          executionId: args.executionId,
          scenarioId: args.scenarioId,
          nodeId: args.nodeId,
          error: error instanceof Error ? error.message : String(error),
        },
      );

      return {
        success: false,
        nodeId: args.nodeId,
        status: "failed",
      };
    }
  },
});

/**
 * Fail an execution due to an unrecoverable error
 */
export const failExecution = internalAction({
  args: {
    executionId: v.id("scenario_executions"),
    scenarioId: v.id("scenarios"),
    nodeId: v.optional(v.id("nodes")),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      console.log(
        `Failing execution ${args.executionId} due to error: ${args.error}`,
      );

      // Get the execution record
      const execution = await ctx.runQuery(
        internal.integrations.scenarios.getExecution,
        { executionId: args.executionId },
      );

      if (!execution) {
        throw new Error(`Execution ${args.executionId} not found`);
      }

      // Get the scenario
      const scenario = await ctx.runQuery(
        internal.integrations.scenarios.getScenario,
        { scenarioId: args.scenarioId },
      );

      if (!scenario) {
        throw new Error(`Scenario ${args.scenarioId} not found`);
      }

      // Update the execution status to failed
      await ctx.runMutation(
        internal.integrations.scenarios.monitoring.updateExecutionStatus,
        {
          executionId: args.executionId,
          status: "failed",
          endTime: Date.now(),
          error: args.error,
          failedNodeId: args.nodeId,
        },
      );

      // Clean up any retry states for this execution
      await ctx.runAction(
        internal.integrations.scenarios.retryManager
          .cleanupExecutionRetryStates,
        { executionId: args.executionId.toString() },
      );

      // Log the execution failure
      await ctx.runMutation(
        internal.integrations.scenarios.monitoring.logExecutionEvent,
        {
          executionId: args.executionId,
          eventType: "execution_failed",
          nodeId: args.nodeId,
          details: {
            error: args.error,
            timestamp: Date.now(),
          },
        },
      );

      // Classify the error
      const errorClassification = await ctx.runAction(
        internal.integrations.scenarios.errorHandling.classifyError,
        { error: args.error },
      );

      // Check if the scenario has error notifications enabled
      if (scenario.errorHandling?.notifyOnError) {
        // Get notification preferences from the scenario or use defaults
        const notificationConfig =
          scenario.errorHandling?.notificationConfig || undefined;

        // Send a notification to the scenario owner
        await ctx.runAction(
          internal.integrations.scenarios.notifications
            .sendExecutionErrorNotification,
          {
            userId: scenario.createdBy,
            scenarioId: args.scenarioId,
            executionId: args.executionId,
            scenarioName: scenario.name,
            error: args.error,
            errorCategory: errorClassification.category,
            errorSeverity: errorClassification.severity,
          },
          notificationConfig,
        );
      }

      // Check if we need to update the scenario status
      if (
        scenario.status === "active" &&
        errorClassification.severity === "critical"
      ) {
        // Update the scenario status to error for critical failures
        await ctx.runMutation(
          internal.integrations.scenarios.management.updateScenarioStatus,
          {
            scenarioId: args.scenarioId,
            status: "error",
            statusDetails: {
              error: args.error,
              errorCategory: errorClassification.category,
              errorSeverity: errorClassification.severity,
              timestamp: Date.now(),
              executionId: args.executionId,
            },
          },
        );
      }

      return {
        success: false,
        executionId: args.executionId,
        error: args.error,
      };
    } catch (error) {
      console.error(`Error failing execution:`, error);
      return {
        success: false,
        executionId: args.executionId,
        error: `Failed to properly handle execution failure: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  },
});

/**
 * Update execution retry count for a node
 */
export const updateExecutionRetryCount = internalMutation({
  args: {
    executionId: v.id("scenario_executions"),
    nodeId: v.id("nodes"),
    retryCount: v.number(),
    maxRetries: v.number(),
    lastRetryTime: v.number(),
  },
  handler: async (ctx, args) => {
    // Get the execution
    const execution = await ctx.db.get(args.executionId);
    if (!execution) {
      throw new Error(`Execution ${args.executionId} not found`);
    }

    // Update the execution with retry information
    await ctx.db.patch(args.executionId, {
      retryCount: args.retryCount,
      maxRetries: args.maxRetries,
      lastRetryTime: args.lastRetryTime,
    });

    // Also update the node results if present
    const nodeResults = execution.nodeResults || [];
    const nodeResultIndex = nodeResults.findIndex(
      (result) => result.nodeId.toString() === args.nodeId.toString(),
    );

    if (nodeResultIndex >= 0) {
      // Update the existing node result with retry information
      nodeResults[nodeResultIndex] = {
        ...nodeResults[nodeResultIndex],
        retryCount: args.retryCount,
        lastRetryTime: args.lastRetryTime,
      };

      // Update the execution with the new node results
      await ctx.db.patch(args.executionId, {
        nodeResults,
      });
    }

    return { success: true };
  },
});

/**
 * Calculate the estimated time remaining for an execution
 */
function calculateEstimatedTimeRemaining(
  startTime: number,
  completedNodeCount: number,
  totalNodeCount: number,
): number | undefined {
  if (completedNodeCount === 0 || totalNodeCount === 0) {
    return undefined;
  }

  const now = Date.now();
  const elapsedTime = now - startTime;
  const completedPercentage = completedNodeCount / totalNodeCount;

  if (completedPercentage === 0) {
    return undefined;
  }

  // Estimate based on the time taken so far
  const totalEstimatedTime = elapsedTime / completedPercentage;
  const remainingTime = totalEstimatedTime - elapsedTime;

  return Math.max(0, Math.round(remainingTime));
}
