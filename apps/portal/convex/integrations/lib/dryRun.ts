import type { ActionContext, ActionResult, NodeIO } from "./registries";

import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";
import { internalAction } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Mock output generators for different action types during dry runs
 */
export function generateMockOutput(actionType: string, input: any): unknown {
  // Action-specific mock data generation
  switch (actionType) {
    case "http.request":
    case "webhooks.send":
      return {
        success: true,
        status: 200,
        statusCode: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
        body: {
          message: "[Dry run] Simulated HTTP response",
          timestamp: Date.now(),
        },
        responseBody: JSON.stringify({
          message: "[Dry run] Simulated HTTP response",
        }),
        timestamp: Date.now(),
        _dryRun: true,
      };

    case "database.query":
    case "database.insert":
    case "database.update":
      return {
        rows: [
          { id: "mock1", name: "Mock Record 1", _dryRun: true },
          { id: "mock2", name: "Mock Record 2", _dryRun: true },
        ],
        count: 2,
        affected: 2,
        _dryRun: true,
        timestamp: Date.now(),
      };

    case "email.send":
      return {
        success: true,
        messageId: `dryrun_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        status: "sent",
        recipient: input?.to || "test@example.com",
        _dryRun: true,
        timestamp: Date.now(),
      };

    case "file.upload":
    case "file.download":
      return {
        success: true,
        fileId: `dryrun_file_${Date.now()}`,
        url: `https://dryrun.example.com/file_${Date.now()}`,
        size: 1024,
        contentType: "application/octet-stream",
        _dryRun: true,
        timestamp: Date.now(),
      };

    case "data.transform":
    case "data.filter":
    case "data.map":
      return {
        data: input?.data || [{ sample: "data", _dryRun: true }],
        processedCount: Array.isArray(input?.data) ? input.data.length : 1,
        _dryRun: true,
        timestamp: Date.now(),
      };

    // Add more action types as needed

    default:
      // Generic mock data for unknown action types
      return {
        _dryRun: true,
        _mockData: true,
        actionType,
        input: input || {},
        timestamp: Date.now(),
        status: "simulated",
      };
  }
}

/**
 * Helper to generate mock trigger payloads based on trigger type
 */
export function generateMockTriggerPayload(triggerKey: string): any {
  switch (triggerKey) {
    case "webhook":
      return {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "user-agent": "DryRun/1.0",
        },
        body: {
          event: "test_event",
          timestamp: Date.now(),
          _dryRun: true,
        },
      };

    case "schedule":
    case "cron":
      return {
        timestamp: Date.now(),
        scheduledTime: new Date().toISOString(),
        cronExpression: "0 0 * * *", // Daily at midnight
        _dryRun: true,
      };

    case "manual":
      return {
        trigger: "manual",
        timestamp: Date.now(),
        user: "dry-run-user",
        _dryRun: true,
      };

    case "file_upload":
      return {
        fileId: `dryrun_file_${Date.now()}`,
        fileName: "sample.txt",
        fileSize: 1024,
        contentType: "text/plain",
        timestamp: Date.now(),
        _dryRun: true,
      };

    default:
      return {
        _dryRun: true,
        _triggerKey: triggerKey,
        timestamp: Date.now(),
        data: {
          message: "Mock trigger payload for dry run",
        },
      };
  }
}

/**
 * Validates that a scenario graph is a DAG (Directed Acyclic Graph)
 */
export function validateScenarioGraph(
  nodes: any[],
  edges: any[],
): { valid: boolean; error?: string } {
  // Check for cycles using DFS
  const adjacencyList = new Map<string, string[]>();

  // Build adjacency list
  for (const node of nodes) {
    adjacencyList.set(node._id, []);
  }

  for (const edge of edges) {
    const sourceNeighbors = adjacencyList.get(edge.sourceNodeId) || [];
    sourceNeighbors.push(edge.targetNodeId);
    adjacencyList.set(edge.sourceNodeId, sourceNeighbors);
  }

  // Check for cycles using DFS with recursion stack
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    if (!visited.has(nodeId)) {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor) && hasCycle(neighbor)) {
          return true;
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node._id) && hasCycle(node._id)) {
      return {
        valid: false,
        error: "Scenario contains cycles, which are not allowed",
      };
    }
  }

  return { valid: true };
}

/**
 * Performs topological sort on nodes based on edges
 * Returns nodes in execution order
 */
export function topologicalSort(nodes: any[], edges: any[]): any[] {
  const adjacencyList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Initialize
  for (const node of nodes) {
    adjacencyList.set(node._id, []);
    inDegree.set(node._id, 0);
  }

  // Build adjacency list and calculate in-degrees
  for (const edge of edges) {
    const sourceNeighbors = adjacencyList.get(edge.sourceNodeId) || [];
    sourceNeighbors.push(edge.targetNodeId);
    adjacencyList.set(edge.sourceNodeId, sourceNeighbors);

    inDegree.set(edge.targetNodeId, (inDegree.get(edge.targetNodeId) || 0) + 1);
  }

  // Find all sources (nodes with in-degree 0)
  const queue: any[] = [];
  for (const node of nodes) {
    if (inDegree.get(node._id) === 0) {
      queue.push(node);
    }
  }

  // Process the queue (Kahn's algorithm)
  const result: any[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    const neighbors = adjacencyList.get(current._id) || [];
    for (const neighbor of neighbors) {
      const newInDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newInDegree);

      if (newInDegree === 0) {
        const neighborNode = nodes.find((node) => node._id === neighbor);
        if (neighborNode) {
          queue.push(neighborNode);
        }
      }
    }
  }

  return result;
}

/**
 * Executes a single node in dry-run mode
 */
export async function executeNodeInDryRun(
  ctx: ActionContext,
  node: any,
  input: NodeIO,
): Promise<NodeIO> {
  try {
    // For dry run, we don't actually execute the node logic
    // Instead, we generate mock output based on the node type
    const mockOutput = generateMockOutput(node.type, input.data);

    return {
      correlationId: input.correlationId,
      data: mockOutput as Record<string, unknown>,
      metadata: {
        nodeId: node._id,
        nodeType: node.type,
        executedAt: Date.now(),
        dryRun: true,
      },
    };
  } catch (error) {
    // Even in dry run, we should catch and report configuration errors
    throw new Error(
      `Dry run validation failed for node ${node._id}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Main dry-run scenario action that validates and simulates scenario execution
 */
export const dryRunScenario = internalAction({
  args: {
    scenarioId: v.id("scenarios"),
    triggerPayload: v.optional(v.any()),
    usePublished: v.optional(v.boolean()), // Whether to use published config (default: draft)
  },
  returns: v.object({
    valid: v.boolean(),
    correlationId: v.optional(v.string()),
    nodeResults: v.optional(v.array(v.any())),
    flowTaken: v.optional(v.array(v.string())),
    error: v.optional(v.string()),
    metadata: v.optional(v.any()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get the scenario
      const scenario = await ctx.runQuery(
        internal.integrations.scenarios.queries.getById,
        { id: args.scenarioId },
      );

      if (!scenario) {
        return {
          valid: false,
          error: `Scenario ${args.scenarioId} not found`,
        };
      }

      // Use published config if requested and available, otherwise use draft
      const config =
        args.usePublished && scenario.publishedConfig
          ? scenario.publishedConfig
          : scenario.draftConfig;

      if (!config) {
        return {
          valid: false,
          error: "No scenario configuration available",
        };
      }

      // Get all nodes for this scenario
      const nodes = await ctx.runQuery(
        internal.integrations.nodes.queries.getByScenarioId,
        { scenarioId: args.scenarioId },
      );

      if (nodes.length === 0) {
        return {
          valid: false,
          error: "No nodes found for this scenario",
        };
      }

      // Get all connections/edges to determine execution flow
      // Try React Flow edges first, then fall back to legacy nodeConnections
      let edges: any[] = [];
      try {
        edges = await ctx.runQuery(
          internal.integrations.nodes.queries.getScenarioEdgesByScenario,
          { scenarioId: args.scenarioId },
        );
      } catch (error) {
        console.warn("No scenario edges found, trying legacy nodeConnections");
        try {
          edges = await ctx.runQuery(
            internal.integrations.nodes.queries.getConnectionsByScenario,
            { scenarioId: args.scenarioId },
          );
        } catch (legacyError) {
          console.warn("No connections found, assuming linear execution");
          // Create a simple linear execution order if no connections exist
          edges = nodes.slice(0, -1).map((node, index) => ({
            sourceNodeId: node._id,
            targetNodeId: nodes[index + 1]._id,
            _id: `edge_${index}`,
          }));
        }
      }

      // Validate the graph is a DAG (no cycles)
      const { valid, error } = validateScenarioGraph(nodes, edges);
      if (!valid) {
        return {
          valid: false,
          error,
        };
      }

      // Create a correlation ID for this dry run
      const correlationId = `dryrun_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

      // Generate or use provided trigger payload
      const triggerPayload =
        args.triggerPayload || generateMockTriggerPayload(config.triggerKey);

      // Sort nodes in execution order (topological sort of the DAG)
      const sortedNodes = topologicalSort(nodes, edges);

      // Execute each node in order and collect results
      const nodeResults: any[] = [];
      const nodeOutputs = new Map<string, NodeIO>();

      // Start with trigger output
      nodeOutputs.set("trigger", {
        correlationId,
        data: triggerPayload,
        metadata: { trigger: true, dryRun: true },
      });

      // Create dry-run context
      const dryRunCtx: ActionContext = {
        ...ctx,
        correlationId,
        dryRun: true,
      };

      for (const node of sortedNodes) {
        try {
          // Get input for this node based on incoming edges
          const inputEdges = edges.filter(
            (edge) => edge.targetNodeId === node._id,
          );

          let input: NodeIO;
          if (inputEdges.length === 0) {
            // No incoming edges, use trigger output
            input = nodeOutputs.get("trigger")!;
          } else {
            // For simplicity, use the output of the first input node
            // In a real implementation, you'd need to handle multiple inputs and merge them
            const sourceNodeId = inputEdges[0].sourceNodeId;
            input =
              nodeOutputs.get(sourceNodeId) || nodeOutputs.get("trigger")!;
          }

          // Execute the node in dry-run mode
          const output = await executeNodeInDryRun(dryRunCtx, node, input);

          // Store the result
          nodeOutputs.set(node._id, output);

          nodeResults.push({
            nodeId: node._id,
            nodeName: node.label || node.type,
            nodeType: node.type,
            status: "success",
            input: input.data,
            output: output.data,
            executedAt: Date.now(),
            dryRun: true,
          });
        } catch (error) {
          nodeResults.push({
            nodeId: node._id,
            nodeName: node.label || node.type,
            nodeType: node.type,
            status: "error",
            input: nodeOutputs.get("trigger")?.data || {},
            error: {
              message: error instanceof Error ? error.message : String(error),
              code: "DRY_RUN_ERROR",
            },
            executedAt: Date.now(),
            dryRun: true,
          });

          // Stop execution if a node fails (even in dry run, this shows validation issues)
          break;
        }
      }

      return {
        valid: true,
        correlationId,
        nodeResults,
        flowTaken: sortedNodes.map((node) => node._id),
        metadata: {
          scenario: {
            id: args.scenarioId,
            name: scenario.name,
            version: scenario.version,
          },
          config: config.triggerKey,
          executedAt: Date.now(),
          dryRun: true,
          totalNodes: sortedNodes.length,
          successfulNodes: nodeResults.filter((r) => r.status === "success")
            .length,
        },
      };
    } catch (error) {
      console.error("Dry run error:", error);
      return {
        valid: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error during dry run",
      };
    }
  },
});
