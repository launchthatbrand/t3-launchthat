import { query } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Get scenario graph data in React Flow format
 * Returns nodes, edges, and UI state suitable for React Flow
 */
export const getScenarioGraph = query({
  args: {
    scenarioId: v.id("scenarios"),
  },
  returns: v.object({
    nodes: v.array(v.any()),
    edges: v.array(v.any()),
    uiState: v.object({
      viewport: v.object({
        x: v.number(),
        y: v.number(),
        zoom: v.number(),
      }),
      selectedNodeIds: v.optional(v.array(v.id("nodes"))),
    }),
  }),
  handler: async (ctx, args) => {
    // Get scenario
    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${args.scenarioId} not found`);
    }

    // Get nodes
    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.scenarioId))
      .collect();

    // Get scenario edges (React Flow edges)
    const edges = await ctx.db
      .query("scenarioEdges")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.scenarioId))
      .collect();

    // Transform nodes to React Flow format
    const rfNodes = nodes.map((node) => ({
      id: node._id,
      type: node.rfType || "default",
      position: node.rfPosition || { x: 0, y: 0 },
      data: {
        nodeId: node._id,
        type: node.type,
        label: node.rfLabel || node.label,
        config: node.config ? JSON.parse(node.config) : {},
        // Include additional node data for the React Flow component
        scenarioId: node.scenarioId,
        createdAt: node.createdAt,
        updatedAt: node.updatedAt,
      },
      width: node.rfWidth,
      height: node.rfHeight,
    }));

    // Transform edges to React Flow format
    const rfEdges = edges.map((edge) => ({
      id: edge._id,
      source: edge.sourceNodeId,
      sourceHandle: edge.sourceHandle,
      target: edge.targetNodeId,
      targetHandle: edge.targetHandle,
      label: edge.label,
      animated: edge.animated || false,
      style: edge.style ? JSON.parse(edge.style) : undefined,
      data: {
        edgeId: edge._id,
        scenarioId: edge.scenarioId,
        order: edge.order,
        createdAt: edge.createdAt,
        updatedAt: edge.updatedAt,
      },
    }));

    // Return with default UI state if none exists
    const uiState = scenario.uiState || {
      viewport: { x: 0, y: 0, zoom: 1 },
      selectedNodeIds: [],
    };

    return {
      nodes: rfNodes,
      edges: rfEdges,
      uiState,
    };
  },
});

/**
 * Get a simplified scenario graph for validation and dry-run purposes
 * This returns the graph in a format suitable for the DAG validation logic
 */
export const getScenarioGraphForValidation = query({
  args: {
    scenarioId: v.id("scenarios"),
  },
  returns: v.object({
    nodes: v.array(
      v.object({
        _id: v.id("nodes"),
        type: v.string(),
        label: v.string(),
      }),
    ),
    edges: v.array(
      v.object({
        _id: v.id("scenarioEdges"),
        sourceNodeId: v.id("nodes"),
        targetNodeId: v.id("nodes"),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    // Get scenario
    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${args.scenarioId} not found`);
    }

    // Get nodes
    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.scenarioId))
      .collect();

    // Get scenario edges
    const edges = await ctx.db
      .query("scenarioEdges")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.scenarioId))
      .collect();

    // Return simplified format for validation
    return {
      nodes: nodes.map((node) => ({
        _id: node._id,
        type: node.type,
        label: node.label,
      })),
      edges: edges.map((edge) => ({
        _id: edge._id,
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
      })),
    };
  },
});

/**
 * Get all React Flow node types currently used in a scenario
 * Useful for component registration and validation
 */
export const getScenarioNodeTypes = query({
  args: {
    scenarioId: v.id("scenarios"),
  },
  returns: v.array(
    v.object({
      type: v.string(),
      rfType: v.optional(v.string()),
      count: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    // Get nodes
    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.scenarioId))
      .collect();

    // Count node types
    const typeCounts = new Map<string, { rfType?: string; count: number }>();

    for (const node of nodes) {
      const key = `${node.type}:${node.rfType || "default"}`;
      const existing = typeCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        typeCounts.set(key, {
          rfType: node.rfType,
          count: 1,
        });
      }
    }

    // Convert to array format
    const result = Array.from(typeCounts.entries()).map(([key, data]) => {
      const [type] = key.split(":");
      return {
        type: type || "unknown", // Ensure type is always a string
        rfType: data.rfType,
        count: data.count,
      };
    });

    return result;
  },
});
