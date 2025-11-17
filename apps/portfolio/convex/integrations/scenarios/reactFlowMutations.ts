import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { mutation, query } from "../../_generated/server";
import { validateScenarioGraph } from "../lib/dryRun";

/**
 * Validate scenario graph without making any changes
 * Returns validation results that can be displayed in the UI
 */
export const validateScenarioGraphQuery = query({
  args: {
    nodes: v.array(
      v.object({
        _id: v.union(v.id("nodes"), v.string()),
        type: v.string(),
        label: v.string(),
      }),
    ),
    edges: v.array(
      v.object({
        _id: v.union(v.id("scenarioEdges"), v.string()),
        sourceNodeId: v.union(v.id("nodes"), v.string()),
        targetNodeId: v.union(v.id("nodes"), v.string()),
      }),
    ),
  },
  returns: v.object({
    valid: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Transform the nodes and edges to the format expected by validateScenarioGraph
    const transformedNodes = args.nodes.map((n) => ({
      ...n,
      _id: typeof n._id === "string" ? n._id : n._id,
    }));

    const transformedEdges = args.edges.map((e) => ({
      ...e,
      _id: typeof e._id === "string" ? e._id : e._id,
      sourceNodeId:
        typeof e.sourceNodeId === "string" ? e.sourceNodeId : e.sourceNodeId,
      targetNodeId:
        typeof e.targetNodeId === "string" ? e.targetNodeId : e.targetNodeId,
    }));

    return validateScenarioGraph(transformedNodes, transformedEdges);
  },
});

/**
 * Batch upsert mutation for React Flow scenario graph
 * Handles creating, updating, and deleting nodes and edges in a single transaction
 */
export const upsertScenarioGraph = mutation({
  args: {
    scenarioId: v.id("scenarios"),
    nodes: v.array(
      v.object({
        _id: v.optional(v.id("nodes")),
        type: v.string(),
        label: v.string(),
        config: v.any(),
        rfType: v.string(),
        rfPosition: v.object({
          x: v.number(),
          y: v.number(),
        }),
        rfLabel: v.optional(v.string()),
        rfWidth: v.optional(v.number()),
        rfHeight: v.optional(v.number()),
      }),
    ),
    edges: v.array(
      v.object({
        _id: v.optional(v.id("scenarioEdges")),
        sourceNodeId: v.id("nodes"),
        sourceHandle: v.optional(v.string()),
        targetNodeId: v.id("nodes"),
        targetHandle: v.optional(v.string()),
        label: v.optional(v.string()),
        animated: v.optional(v.boolean()),
        style: v.optional(v.string()),
        order: v.optional(v.number()),
      }),
    ),
    uiState: v.optional(
      v.object({
        viewport: v.object({
          x: v.number(),
          y: v.number(),
          zoom: v.number(),
        }),
        selectedNodeIds: v.optional(v.array(v.id("nodes"))),
      }),
    ),
  },
  returns: v.object({
    success: v.boolean(),
    nodeIdMap: v.optional(v.any()), // Map of temp IDs to real IDs
    edgeIdMap: v.optional(v.any()), // Map of temp IDs to real IDs
  }),
  handler: async (ctx, args) => {
    // Verify scenario exists
    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${args.scenarioId} not found`);
    }

    // TODO: Validate node types against registry when available
    // For now, we'll skip this validation

    // Validate the graph is a DAG
    const tempNodes = args.nodes.map((n, index) => ({
      ...n,
      _id: n._id ?? (`temp_node_${index}` as Id<"nodes">),
    }));

    const tempEdges = args.edges.map((e, index) => ({
      ...e,
      _id: e._id ?? (`temp_edge_${index}` as Id<"scenarioEdges">),
    }));

    const { valid, error } = validateScenarioGraph(tempNodes, tempEdges);
    if (!valid) {
      throw new Error(`Invalid scenario graph: ${error}`);
    }

    // Start transaction
    const now = Date.now();

    // Get existing nodes and edges
    const existingNodes = await ctx.db
      .query("nodes")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.scenarioId))
      .collect();

    const existingEdges = await ctx.db
      .query("scenarioEdges")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.scenarioId))
      .collect();

    // Track IDs for operations
    const existingNodeIds = new Set(existingNodes.map((n) => n._id));
    const updatedNodeIds = new Set<Id<"nodes">>();
    const nodeIdMap = new Map<string, Id<"nodes">>();

    const existingEdgeIds = new Set(existingEdges.map((e) => e._id));
    const updatedEdgeIds = new Set<Id<"scenarioEdges">>();
    const edgeIdMap = new Map<string, Id<"scenarioEdges">>();

    // Process nodes first (create/update)
    for (const node of args.nodes) {
      if (node._id && existingNodeIds.has(node._id)) {
        // Update existing node
        await ctx.db.patch(node._id, {
          type: node.type,
          label: node.label,
          config: JSON.stringify(node.config),
          rfType: node.rfType,
          rfPosition: node.rfPosition,
          rfLabel: node.rfLabel,
          rfWidth: node.rfWidth,
          rfHeight: node.rfHeight,
          updatedAt: now,
        });
        updatedNodeIds.add(node._id);
        nodeIdMap.set(node._id, node._id);
      } else {
        // Insert new node
        const nodeId = await ctx.db.insert("nodes", {
          scenarioId: args.scenarioId,
          type: node.type,
          label: node.label,
          config: JSON.stringify(node.config),
          position: JSON.stringify(node.rfPosition), // Legacy field
          rfType: node.rfType,
          rfPosition: node.rfPosition,
          rfLabel: node.rfLabel,
          rfWidth: node.rfWidth,
          rfHeight: node.rfHeight,
          createdAt: now,
          updatedAt: now,
        });

        updatedNodeIds.add(nodeId);
        if (node._id) {
          nodeIdMap.set(node._id, nodeId);
        }
      }
    }

    // Delete nodes that weren't updated
    for (const nodeId of existingNodeIds) {
      if (!updatedNodeIds.has(nodeId)) {
        await ctx.db.delete(nodeId);
      }
    }

    // Process edges (create/update)
    for (const edge of args.edges) {
      // Resolve node IDs in case they were temporary
      const sourceNodeId =
        nodeIdMap.get(edge.sourceNodeId) ?? edge.sourceNodeId;
      const targetNodeId =
        nodeIdMap.get(edge.targetNodeId) ?? edge.targetNodeId;

      if (edge._id && existingEdgeIds.has(edge._id)) {
        // Update existing edge
        await ctx.db.patch(edge._id, {
          sourceNodeId,
          sourceHandle: edge.sourceHandle,
          targetNodeId,
          targetHandle: edge.targetHandle,
          label: edge.label,
          animated: edge.animated,
          style: edge.style,
          order: edge.order,
          updatedAt: now,
        });
        updatedEdgeIds.add(edge._id);
        edgeIdMap.set(edge._id, edge._id);
      } else {
        // Insert new edge
        const edgeId = await ctx.db.insert("scenarioEdges", {
          scenarioId: args.scenarioId,
          sourceNodeId,
          sourceHandle: edge.sourceHandle,
          targetNodeId,
          targetHandle: edge.targetHandle,
          label: edge.label,
          animated: edge.animated,
          style: edge.style,
          order: edge.order,
          createdAt: now,
          updatedAt: now,
        });

        updatedEdgeIds.add(edgeId);
        if (edge._id) {
          edgeIdMap.set(edge._id, edgeId);
        }
      }
    }

    // Delete edges that weren't updated
    for (const edgeId of existingEdgeIds) {
      if (!updatedEdgeIds.has(edgeId)) {
        await ctx.db.delete(edgeId);
      }
    }

    // Update scenario UI state if provided
    if (args.uiState) {
      await ctx.db.patch(args.scenarioId, {
        uiState: args.uiState,
        updatedAt: now,
      });
    }

    return {
      success: true,
      nodeIdMap: Object.fromEntries(nodeIdMap),
      edgeIdMap: Object.fromEntries(edgeIdMap),
    };
  },
});

/**
 * Update just the UI state for a scenario (viewport, selected nodes)
 */
export const updateScenarioUIState = mutation({
  args: {
    scenarioId: v.id("scenarios"),
    uiState: v.object({
      viewport: v.object({
        x: v.number(),
        y: v.number(),
        zoom: v.number(),
      }),
      selectedNodeIds: v.optional(v.array(v.id("nodes"))),
    }),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Verify scenario exists
    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${args.scenarioId} not found`);
    }

    await ctx.db.patch(args.scenarioId, {
      uiState: args.uiState,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Create a single scenario edge
 */
export const createScenarioEdge = mutation({
  args: {
    scenarioId: v.id("scenarios"),
    sourceNodeId: v.id("nodes"),
    targetNodeId: v.id("nodes"),
    sourceHandle: v.optional(v.string()),
    targetHandle: v.optional(v.string()),
    label: v.optional(v.string()),
    animated: v.optional(v.boolean()),
    style: v.optional(v.string()),
  },
  returns: v.id("scenarioEdges"),
  handler: async (ctx, args) => {
    // Verify scenario exists
    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${args.scenarioId} not found`);
    }

    // Verify source and target nodes exist and belong to the scenario
    const sourceNode = await ctx.db.get(args.sourceNodeId);
    const targetNode = await ctx.db.get(args.targetNodeId);

    if (!sourceNode || sourceNode.scenarioId !== args.scenarioId) {
      throw new Error(`Source node ${args.sourceNodeId} not found in scenario`);
    }

    if (!targetNode || targetNode.scenarioId !== args.scenarioId) {
      throw new Error(`Target node ${args.targetNodeId} not found in scenario`);
    }

    const now = Date.now();
    const edgeId = await ctx.db.insert("scenarioEdges", {
      scenarioId: args.scenarioId,
      sourceNodeId: args.sourceNodeId,
      sourceHandle: args.sourceHandle,
      targetNodeId: args.targetNodeId,
      targetHandle: args.targetHandle,
      label: args.label,
      animated: args.animated,
      style: args.style,
      createdAt: now,
      updatedAt: now,
    });

    return edgeId;
  },
});

/**
 * Delete a scenario edge
 */
export const deleteScenarioEdge = mutation({
  args: {
    edgeId: v.id("scenarioEdges"),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Verify edge exists
    const edge = await ctx.db.get(args.edgeId);
    if (!edge) {
      throw new Error(`Edge ${args.edgeId} not found`);
    }

    await ctx.db.delete(args.edgeId);

    return { success: true };
  },
});
