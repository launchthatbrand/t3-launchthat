import type { ActionContext, ActionResult, NodeIO } from "./registries";
import { ErrorCode, createError } from "./errors";
import {
  createRetryConfig,
  createRetryContext,
  executeWithRetry,
} from "./retry";
import { markRunAsFailed, markRunAsSucceeded } from "./runManagement";

import type { Id } from "../../_generated/dataModel";
import { createCorrelationId } from "./idempotency";
import { internal } from "../../_generated/api";
import { internalAction } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Execute a complete scenario from trigger to completion
 * This is the main orchestration function that ties all components together
 */
export const executeScenario = internalAction({
  args: {
    scenarioId: v.id("scenarios"),
    runId: v.id("scenarioRuns"),
    payload: v.any(),
    correlationId: v.string(),
    triggerKey: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    runId: v.id("scenarioRuns"),
    error: v.optional(v.string()),
    nodesExecuted: v.number(),
    totalDuration: v.number(),
  }),
  handler: async (ctx, args) => {
    const startTime = Date.now();
    let nodesExecuted = 0;

    try {
      // Get the scenario and validate it exists
      const scenario = await ctx.runQuery(
        internal.integrations.scenarios.queries.getById,
        { id: args.scenarioId },
      );

      if (!scenario) {
        throw new Error(`Scenario ${args.scenarioId} not found`);
      }

      if (!scenario.enabled) {
        throw new Error(`Scenario ${args.scenarioId} is disabled`);
      }

      // Update run status to running
      await ctx.runMutation(
        internal.integrations.scenarioRuns.mutations.updateScenarioRun,
        {
          runId: args.runId,
          status: "running",
        },
      );

      // Get all nodes for this scenario
      const nodes = await ctx.runQuery(
        internal.integrations.nodes.queries.getByScenarioId,
        { scenarioId: args.scenarioId },
      );

      if (nodes.length === 0) {
        await markRunAsSucceeded(ctx, args.runId, args.scenarioId);
        return {
          success: true,
          runId: args.runId,
          nodesExecuted: 0,
          totalDuration: Date.now() - startTime,
        };
      }

      // Get execution order using React Flow edges if available, fallback to legacy connections
      let edges: any[] = [];
      try {
        edges = await ctx.runQuery(
          internal.integrations.nodes.queries.getScenarioEdgesByScenario,
          { scenarioId: args.scenarioId },
        );
      } catch (error) {
        console.warn("No scenario edges found, using legacy connections");
        try {
          edges = await ctx.runQuery(
            internal.integrations.nodes.queries.getConnectionsByScenario,
            { scenarioId: args.scenarioId },
          );
        } catch (legacyError) {
          console.warn("No connections found, using linear execution order");
          edges = nodes.slice(0, -1).map((node, index) => ({
            sourceNodeId: node._id,
            targetNodeId: nodes[index + 1]._id,
            _id: `temp_edge_${index}`,
          }));
        }
      }

      // Build execution order using topological sort
      const executionOrder = buildExecutionOrder(nodes, edges);

      // Initialize node outputs map
      const nodeOutputs = new Map<string, NodeIO>();

      // Set initial trigger output
      nodeOutputs.set("trigger", {
        correlationId: args.correlationId,
        data: args.payload,
        metadata: {
          triggerKey: args.triggerKey,
          scenarioId: args.scenarioId,
          timestamp: startTime,
        },
      });

      // Execute nodes in order
      for (const [stepIndex, node] of executionOrder.entries()) {
        try {
          // Get inputs for this node from incoming edges
          const inputEdges = edges.filter(
            (edge) => edge.targetNodeId === node._id,
          );

          // For now, we'll use a simple strategy: take the first input
          // In a production system, you'd need proper input mapping and merging
          let nodeInput: NodeIO;
          if (inputEdges.length > 0) {
            const sourceNodeId = inputEdges[0].sourceNodeId;
            nodeInput = nodeOutputs.get(sourceNodeId) || {
              correlationId: args.correlationId,
              data: {},
              metadata: { step: stepIndex },
            };
          } else {
            // No incoming edges, use trigger output
            nodeInput = nodeOutputs.get("trigger") || {
              correlationId: args.correlationId,
              data: args.payload,
              metadata: { step: stepIndex },
            };
          }

          // Create retry context
          const retryContext = createRetryContext(
            args.runId,
            args.scenarioId,
            `execute_node_${node.type}`,
            args.correlationId,
            node._id,
            stepIndex + 1,
          );

          // Execute the node with retry logic
          const result = await executeWithRetry(
            ctx,
            retryContext,
            async (): Promise<ActionResult<unknown>> => {
              return await executeNode(ctx, node, nodeInput);
            },
            createRetryConfig("standard"),
          );

          if (result.kind === "success") {
            // Store output for downstream nodes
            nodeOutputs.set(node._id, {
              correlationId: args.correlationId,
              data: result.data,
              metadata: {
                nodeId: node._id,
                step: stepIndex + 1,
                executedAt: Date.now(),
              },
            });
            nodesExecuted++;
          } else {
            // Node execution failed, mark run as failed
            await markRunAsFailed(
              ctx,
              args.runId,
              args.scenarioId,
              result.error || {
                code: "UNKNOWN_ERROR",
                message: "Node execution failed",
              },
              { isFatal: result.kind === "fatal_error", retryCount: 3 },
            );

            return {
              success: false,
              runId: args.runId,
              error: `Node ${node.label || node.type} failed: ${result.error?.message || "Unknown error"}`,
              nodesExecuted,
              totalDuration: Date.now() - startTime,
            };
          }
        } catch (error) {
          // Unexpected error during node execution
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          await markRunAsFailed(
            ctx,
            args.runId,
            args.scenarioId,
            { code: "UNEXPECTED_ERROR", message: errorMessage },
            { isFatal: true },
          );

          return {
            success: false,
            runId: args.runId,
            error: `Unexpected error executing node ${node.label || node.type}: ${errorMessage}`,
            nodesExecuted,
            totalDuration: Date.now() - startTime,
          };
        }
      }

      // All nodes executed successfully
      await markRunAsSucceeded(ctx, args.runId, args.scenarioId);

      return {
        success: true,
        runId: args.runId,
        nodesExecuted,
        totalDuration: Date.now() - startTime,
      };
    } catch (error) {
      // Scenario-level error
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      await markRunAsFailed(
        ctx,
        args.runId,
        args.scenarioId,
        { code: "SCENARIO_ERROR", message: errorMessage },
        { isFatal: true },
      );

      return {
        success: false,
        runId: args.runId,
        error: errorMessage,
        nodesExecuted,
        totalDuration: Date.now() - startTime,
      };
    }
  },
});

/**
 * Execute a single node with proper error handling and logging
 */
async function executeNode(
  ctx: ActionContext,
  node: any,
  input: NodeIO,
): Promise<ActionResult<unknown>> {
  try {
    // Parse node configuration
    let config: any;
    try {
      config =
        typeof node.config === "string" ? JSON.parse(node.config) : node.config;
    } catch (error) {
      return createError(
        ErrorCode.VALIDATION_FAILED,
        `Invalid node configuration: ${error instanceof Error ? error.message : "Invalid JSON"}`,
      );
    }

    // For now, we'll implement basic node types
    // In a production system, you'd use the action registry
    switch (node.type) {
      case "logger":
        return await executeLoggerNode(config, input);

      case "http_request":
        return await executeHttpRequestNode(config, input);

      case "data_transform":
        return await executeDataTransformNode(config, input);

      case "webhook_send":
        return await executeWebhookSendNode(ctx, config, input);

      default:
        return createError(
          ErrorCode.VALIDATION_FAILED,
          `Unknown node type: ${node.type}`,
        );
    }
  } catch (error) {
    return createError(
      ErrorCode.EXECUTION_FAILED,
      `Node execution error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Execute a logger node (for testing and debugging)
 */
async function executeLoggerNode(
  config: any,
  input: NodeIO,
): Promise<ActionResult<unknown>> {
  const message = config.message || "Logger node executed";
  const logData = {
    message,
    input: input.data,
    timestamp: Date.now(),
    correlationId: input.correlationId,
  };

  console.log(`[Logger Node] ${message}`, logData);

  return {
    kind: "success",
    data: {
      logged: true,
      message,
      inputData: input.data,
      timestamp: Date.now(),
    },
  };
}

/**
 * Execute an HTTP request node
 */
async function executeHttpRequestNode(
  config: any,
  input: NodeIO,
): Promise<ActionResult<unknown>> {
  try {
    const url = config.url || "https://httpbin.org/post";
    const method = config.method || "POST";
    const headers = config.headers || { "Content-Type": "application/json" };

    const response = await fetch(url, {
      method,
      headers,
      body: method !== "GET" ? JSON.stringify(input.data) : undefined,
    });

    const responseData = await response.text();
    let parsedData;
    try {
      parsedData = JSON.parse(responseData);
    } catch {
      parsedData = responseData;
    }

    return {
      kind: "success",
      data: {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: parsedData,
        success: response.ok,
      },
    };
  } catch (error) {
    return createError(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      `HTTP request failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Execute a data transformation node
 */
async function executeDataTransformNode(
  config: any,
  input: NodeIO,
): Promise<ActionResult<unknown>> {
  try {
    const transformType = config.transformType || "passthrough";

    switch (transformType) {
      case "passthrough":
        return {
          kind: "success",
          data: input.data,
        };

      case "extract_field":
        const fieldPath = config.fieldPath || "data";
        const value = extractFieldByPath(input.data, fieldPath);
        return {
          kind: "success",
          data: { [config.outputField || "extracted"]: value },
        };

      case "add_timestamp":
        return {
          kind: "success",
          data: {
            ...input.data,
            timestamp: Date.now(),
            processedAt: new Date().toISOString(),
          },
        };

      default:
        return createError(
          ErrorCode.VALIDATION_FAILED,
          `Unknown transform type: ${transformType}`,
        );
    }
  } catch (error) {
    return createError(
      ErrorCode.EXECUTION_FAILED,
      `Data transform failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Execute a webhook send node
 */
async function executeWebhookSendNode(
  ctx: ActionContext,
  config: any,
  input: NodeIO,
): Promise<ActionResult<unknown>> {
  try {
    const webhookUrl = config.webhookUrl;
    if (!webhookUrl) {
      return createError(
        ErrorCode.VALIDATION_FAILED,
        "Webhook URL is required",
      );
    }

    // Use the existing webhook action
    const result = await ctx.runAction(
      internal.integrations.actions.webhooks.sendWebhook,
      {
        webhookUrl,
        payload: input.data,
        secret: config.secret,
        headers: config.headers || {},
        retryAttempts: config.retryAttempts || 3,
        timeout: config.timeout || 30000,
        eventType: config.eventType || "scenario_webhook",
      },
    );

    return {
      kind: "success",
      data: result,
    };
  } catch (error) {
    return createError(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      `Webhook send failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Build execution order using simple topological sort
 * In a production system, this would be more sophisticated
 */
function buildExecutionOrder(nodes: any[], edges: any[]): any[] {
  // Create adjacency list for topological sort
  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Initialize all nodes
  for (const node of nodes) {
    graph.set(node._id, []);
    inDegree.set(node._id, 0);
  }

  // Build the graph
  for (const edge of edges) {
    const sourceId = edge.sourceNodeId;
    const targetId = edge.targetNodeId;

    // Skip edges from "trigger" as it's not a real node
    if (sourceId === "trigger") continue;

    if (graph.has(sourceId) && inDegree.has(targetId)) {
      graph.get(sourceId)!.push(targetId);
      inDegree.set(targetId, inDegree.get(targetId)! + 1);
    }
  }

  // Perform topological sort (Kahn's algorithm)
  const result: any[] = [];
  const queue: string[] = [];

  // Start with nodes that have no incoming edges
  for (const [nodeId, degree] of inDegree.entries()) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentNode = nodes.find((n) => n._id === currentId);
    if (currentNode) {
      result.push(currentNode);
    }

    // Update in-degrees of adjacent nodes
    const adjacentNodes = graph.get(currentId) || [];
    for (const adjacentId of adjacentNodes) {
      const newDegree = inDegree.get(adjacentId)! - 1;
      inDegree.set(adjacentId, newDegree);

      if (newDegree === 0) {
        queue.push(adjacentId);
      }
    }
  }

  // If we didn't process all nodes, there might be cycles or disconnected components
  // Fall back to the original order
  if (result.length !== nodes.length) {
    console.warn(
      "Could not determine execution order, using original node order",
    );
    return nodes;
  }

  return result;
}

/**
 * Extract a field from an object using dot notation path
 */
function extractFieldByPath(obj: any, path: string): any {
  const keys = path.split(".");
  let current = obj;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return current;
}
