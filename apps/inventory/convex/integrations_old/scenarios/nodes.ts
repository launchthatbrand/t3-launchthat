/**
 * Node management for the integrations module
 *
 * This file provides functions for managing nodes within scenarios,
 * including creating, listing, updating, and deleting nodes.
 */
import { ConvexError, v } from "convex/values";

import { Id } from "../../_generated/dataModel";
import { internalQuery, mutation, query } from "../../_generated/server";
import { getOptionalUserId, requireUserId } from "../lib/auth";
import { NodeType } from "../schema/types";

// Define node-specific audit event types
const NODE_AUDIT_EVENTS = {
  NODE_CREATE: "node_create",
  NODE_UPDATE: "node_update",
  NODE_DELETE: "node_delete",
  NODE_REORDER: "node_reorder",
} as const;

/**
 * Create a new node in a scenario
 */
export const createNode = mutation({
  args: {
    scenarioId: v.id("scenarios"),
    type: v.union(
      v.literal("trigger"),
      v.literal("action"),
      v.literal("transformer"),
      v.literal("condition"),
    ),
    appId: v.optional(v.id("apps")),
    connectionId: v.optional(v.id("connections")),
    operation: v.string(),
    config: v.object({}),
    position: v.optional(v.number()),
  },
  returns: v.object({
    nodeId: v.id("nodes"),
    position: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get the user ID
    const userId = await requireUserId(ctx);

    // Get the scenario
    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario) {
      throw new ConvexError("Scenario not found");
    }

    // Check if the user has access to this scenario
    if (scenario.createdBy !== userId) {
      throw new ConvexError(
        "You don't have permission to modify this scenario",
      );
    }

    // If position is not provided, add the node at the end
    let position = args.position ?? 0;
    if (!args.position) {
      // Get the last position
      const lastNode = await ctx.db
        .query("nodes")
        .withIndex("by_scenario_position", (q) =>
          q.eq("scenarioId", args.scenarioId),
        )
        .order("desc")
        .first();

      position = lastNode ? lastNode.position + 1 : 0;
    } else {
      // If position is provided, shift other nodes
      const nodesAtOrAfterPosition = await ctx.db
        .query("nodes")
        .withIndex("by_scenario_position", (q) =>
          q.eq("scenarioId", args.scenarioId),
        )
        .filter((q) => q.gte(q.field("position"), position))
        .collect();

      // Update positions of subsequent nodes
      for (const node of nodesAtOrAfterPosition) {
        await ctx.db.patch(node._id, {
          position: node.position + 1,
        });
      }
    }

    // Create the node
    const nodeId = await ctx.db.insert("nodes", {
      scenarioId: args.scenarioId,
      type: args.type as NodeType,
      position,
      appId: args.appId ?? undefined,
      connectionId: args.connectionId ?? undefined,
      operation: args.operation,
      config: args.config,
      inputMappings: {},
      outputMappings: {},
      conditions: undefined,
    });

    // Update scenario updatedAt timestamp
    await ctx.db.patch(args.scenarioId, {
      updatedAt: Date.now(),
    });

    // Log the node creation event
    await ctx.db.insert("audit_logs", {
      action: NODE_AUDIT_EVENTS.NODE_CREATE,
      resourceType: "node",
      // Cast to string first to avoid type errors with resource IDs
      resourceId: nodeId.toString() as any,
      userId,
      timestamp: Date.now(),
      metadata: {
        nodeId,
        scenarioId: args.scenarioId,
        type: args.type,
      },
    });

    return { nodeId, position };
  },
});

/**
 * Get all nodes for a scenario
 */
export const getScenarioNodes = query({
  args: {
    scenarioId: v.id("scenarios"),
  },
  returns: v.array(
    v.object({
      _id: v.id("nodes"),
      _creationTime: v.number(),
      scenarioId: v.id("scenarios"),
      type: v.string(),
      position: v.number(),
      appId: v.optional(v.id("apps")),
      connectionId: v.optional(v.id("connections")),
      operation: v.string(),
      config: v.object({}),
      inputMappings: v.record(v.string(), v.string()),
      outputMappings: v.record(v.string(), v.string()),
      conditions: v.optional(v.array(v.object({}))),
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

    // Get all nodes for this scenario
    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.scenarioId))
      .order("asc")
      .collect();

    return nodes;
  },
});

/**
 * Get a node by ID
 */
export const getNode = query({
  args: {
    nodeId: v.id("nodes"),
  },
  returns: v.union(
    v.object({
      _id: v.id("nodes"),
      _creationTime: v.number(),
      scenarioId: v.id("scenarios"),
      type: v.string(),
      position: v.number(),
      appId: v.optional(v.id("apps")),
      connectionId: v.optional(v.id("connections")),
      operation: v.string(),
      config: v.object({}),
      inputMappings: v.record(v.string(), v.string()),
      outputMappings: v.record(v.string(), v.string()),
      conditions: v.optional(v.array(v.object({}))),
      app: v.optional(
        v.object({
          _id: v.id("apps"),
          name: v.string(),
          iconUrl: v.string(),
        }),
      ),
      connection: v.optional(
        v.object({
          _id: v.id("connections"),
          name: v.string(),
          status: v.string(),
        }),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    // Get the user ID
    const userId = await getOptionalUserId(ctx);
    if (!userId) {
      return null;
    }

    // Get the node
    const node = await ctx.db.get(args.nodeId);
    if (!node) {
      return null;
    }

    // Get the scenario
    const scenario = await ctx.db.get(node.scenarioId);
    if (!scenario) {
      return null;
    }

    // Check if the user has access to this scenario
    if (scenario.createdBy !== userId) {
      return null;
    }

    // Get app and connection details if applicable
    let app = undefined;
    let connection = undefined;

    if (node.appId) {
      const appData = await ctx.db.get(node.appId);
      if (appData) {
        app = {
          _id: appData._id,
          name: appData.name,
          iconUrl: appData.iconUrl,
        };
      }
    }

    if (node.connectionId) {
      const connectionData = await ctx.db.get(node.connectionId);
      if (connectionData) {
        connection = {
          _id: connectionData._id,
          name: connectionData.name,
          status: connectionData.status,
        };
      }
    }

    return {
      ...node,
      app,
      connection,
    };
  },
});

/**
 * Update a node
 */
export const updateNode = mutation({
  args: {
    nodeId: v.id("nodes"),
    config: v.optional(v.object({})),
    connectionId: v.optional(v.union(v.id("connections"), v.null())),
    inputMappings: v.optional(v.record(v.string(), v.string())),
    outputMappings: v.optional(v.record(v.string(), v.string())),
    conditions: v.optional(
      v.union(
        v.array(
          v.object({
            field: v.string(),
            operator: v.string(),
            value: v.object({}),
            combinator: v.optional(v.union(v.literal("and"), v.literal("or"))),
          }),
        ),
        v.null(),
      ),
    ),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get the user ID
      const userId = await requireUserId(ctx);

      // Get the node
      const node = await ctx.db.get(args.nodeId);
      if (!node) {
        return {
          success: false,
          error: "Node not found",
        };
      }

      // Get the scenario
      const scenario = await ctx.db.get(node.scenarioId);
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
          error: "You don't have permission to modify this node",
        };
      }

      // Build the update object
      const updateObj: Record<string, unknown> = {};

      if (args.config !== undefined) updateObj.config = args.config;
      if (args.connectionId !== undefined) {
        updateObj.connectionId = args.connectionId ?? undefined;
      }
      if (args.inputMappings !== undefined)
        updateObj.inputMappings = args.inputMappings;
      if (args.outputMappings !== undefined)
        updateObj.outputMappings = args.outputMappings;
      if (args.conditions !== undefined) {
        updateObj.conditions = args.conditions ?? undefined;
      }

      // Update the node
      await ctx.db.patch(args.nodeId, updateObj);

      // Update scenario updatedAt timestamp
      await ctx.db.patch(node.scenarioId, {
        updatedAt: Date.now(),
      });

      // Log the node update event
      await ctx.db.insert("audit_logs", {
        action: NODE_AUDIT_EVENTS.NODE_UPDATE,
        resourceType: "node",
        resourceId: args.nodeId.toString() as any,
        userId,
        timestamp: Date.now(),
        metadata: {
          nodeId: args.nodeId,
          scenarioId: node.scenarioId,
          updatedFields: Object.keys(updateObj),
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error updating node";
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});

/**
 * Delete a node
 */
export const deleteNode = mutation({
  args: {
    nodeId: v.id("nodes"),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get the user ID
      const userId = await requireUserId(ctx);

      // Get the node
      const node = await ctx.db.get(args.nodeId);
      if (!node) {
        return {
          success: false,
          error: "Node not found",
        };
      }

      // Get the scenario
      const scenario = await ctx.db.get(node.scenarioId);
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
          error: "You don't have permission to delete this node",
        };
      }

      // Delete the node
      await ctx.db.delete(args.nodeId);

      // Reorder the remaining nodes
      const nodesAfterPosition = await ctx.db
        .query("nodes")
        .withIndex("by_scenario_position", (q) =>
          q.eq("scenarioId", node.scenarioId),
        )
        .filter((q) => q.gt(q.field("position"), node.position))
        .collect();

      // Update positions of subsequent nodes
      for (const otherNode of nodesAfterPosition) {
        await ctx.db.patch(otherNode._id, {
          position: otherNode.position - 1,
        });
      }

      // Update scenario updatedAt timestamp
      await ctx.db.patch(node.scenarioId, {
        updatedAt: Date.now(),
      });

      // Log the node deletion event
      await ctx.db.insert("audit_logs", {
        action: NODE_AUDIT_EVENTS.NODE_DELETE,
        resourceType: "node",
        resourceId: args.nodeId.toString() as any,
        userId,
        timestamp: Date.now(),
        metadata: {
          nodeId: args.nodeId,
          scenarioId: node.scenarioId,
          position: node.position,
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error deleting node";
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});

/**
 * Reorder a node within a scenario
 */
export const reorderNode = mutation({
  args: {
    nodeId: v.id("nodes"),
    newPosition: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get the user ID
      const userId = await requireUserId(ctx);

      // Get the node
      const node = await ctx.db.get(args.nodeId);
      if (!node) {
        return {
          success: false,
          error: "Node not found",
        };
      }

      // Get the scenario
      const scenario = await ctx.db.get(node.scenarioId);
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
          error: "You don't have permission to modify this node",
        };
      }

      // If the position hasn't changed, do nothing
      if (node.position === args.newPosition) {
        return { success: true };
      }

      // Get all nodes for this scenario
      const nodes = await ctx.db
        .query("nodes")
        .withIndex("by_scenario", (q) => q.eq("scenarioId", node.scenarioId))
        .collect();

      // Validate the new position
      if (args.newPosition < 0 || args.newPosition >= nodes.length) {
        return {
          success: false,
          error: `Invalid position: ${args.newPosition}. Valid range: 0-${nodes.length - 1}`,
        };
      }

      // Update positions based on whether we're moving the node up or down
      if (args.newPosition < node.position) {
        // Moving up: increment positions for nodes between new position and old position
        for (const otherNode of nodes) {
          if (otherNode._id === node._id) continue;

          if (
            otherNode.position >= args.newPosition &&
            otherNode.position < node.position
          ) {
            await ctx.db.patch(otherNode._id, {
              position: otherNode.position + 1,
            });
          }
        }
      } else {
        // Moving down: decrement positions for nodes between old position and new position
        for (const otherNode of nodes) {
          if (otherNode._id === node._id) continue;

          if (
            otherNode.position > node.position &&
            otherNode.position <= args.newPosition
          ) {
            await ctx.db.patch(otherNode._id, {
              position: otherNode.position - 1,
            });
          }
        }
      }

      // Update the node's position
      await ctx.db.patch(args.nodeId, {
        position: args.newPosition,
      });

      // Update scenario updatedAt timestamp
      await ctx.db.patch(node.scenarioId, {
        updatedAt: Date.now(),
      });

      // Log the node reorder event
      await ctx.db.insert("audit_logs", {
        action: NODE_AUDIT_EVENTS.NODE_REORDER,
        resourceType: "node",
        resourceId: args.nodeId.toString() as any,
        userId,
        timestamp: Date.now(),
        metadata: {
          nodeId: args.nodeId,
          scenarioId: node.scenarioId,
          oldPosition: node.position,
          newPosition: args.newPosition,
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error reordering node";
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});

/**
 * Get a node by ID (internal)
 */
export const getNodeById = internalQuery({
  args: {
    nodeId: v.id("nodes"),
  },
  returns: v.union(v.object({}), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.nodeId);
  },
});
