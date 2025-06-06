/**
 * Scenario management for the integrations module
 *
 * This file provides functions for managing integration scenarios,
 * including creating, listing, updating, and deleting scenarios.
 */
import { ConvexError, v } from "convex/values";

import { Id } from "../../_generated/dataModel";
import { mutation, query } from "../../_generated/server";
import { getOptionalUserId, requireUserId } from "../lib/auth";
import { ScenarioStatus } from "../schema/types";

// Define scenario-specific audit event types
const SCENARIO_AUDIT_EVENTS = {
  SCENARIO_CREATE: "scenario_create",
  SCENARIO_UPDATE: "scenario_update",
  SCENARIO_DELETE: "scenario_delete",
  SCENARIO_ACTIVATE: "scenario_activate",
  SCENARIO_PAUSE: "scenario_pause",
} as const;

/**
 * Create a new scenario
 */
export const createScenario = mutation({
  args: {
    name: v.string(),
    description: v.string(),
  },
  returns: v.object({
    scenarioId: v.id("scenarios"),
  }),
  handler: async (ctx, args) => {
    // Get the user ID
    const userId = await requireUserId(ctx);

    // Create the scenario
    const scenarioId = await ctx.db.insert("scenarios", {
      name: args.name,
      description: args.description,
      status: "draft" as ScenarioStatus,
      createdBy: userId,
      updatedAt: Date.now(),
      errorHandling: {
        retryCount: 3,
        notifyOnError: true,
      },
    });

    // Log the scenario creation event
    await ctx.db.insert("audit_logs", {
      action: SCENARIO_AUDIT_EVENTS.SCENARIO_CREATE,
      resourceType: "scenario",
      resourceId: scenarioId.toString(),
      userId,
      timestamp: Date.now(),
      metadata: {
        scenarioId,
        name: args.name,
      },
    });

    return { scenarioId };
  },
});

/**
 * Get all scenarios for the current user
 */
export const getUserScenarios = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("draft"),
        v.literal("paused"),
        v.literal("error"),
      ),
    ),
  },
  returns: v.array(
    v.object({
      _id: v.id("scenarios"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.string(),
      status: v.string(),
      createdBy: v.id("users"),
      updatedAt: v.number(),
      lastRun: v.optional(v.number()),
      schedule: v.optional(
        v.object({
          frequency: v.string(),
          interval: v.number(),
          startTime: v.optional(v.number()),
          timezone: v.optional(v.string()),
          dayOfWeek: v.optional(v.number()),
          dayOfMonth: v.optional(v.number()),
        }),
      ),
      nodeCount: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    // Get the user ID
    const userId = await getOptionalUserId(ctx);
    if (!userId) {
      return [];
    }

    // Start building the query
    let query = ctx.db
      .query("scenarios")
      .withIndex("by_user", (q) => q.eq("createdBy", userId));

    // Apply status filter if provided
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    // Execute the query and collect the results
    const scenarios = await query.collect();

    // Now get the node count for each scenario
    const scenariosWithNodeCount = await Promise.all(
      scenarios.map(async (scenario) => {
        const nodeCount = await ctx.db
          .query("nodes")
          .withIndex("by_scenario", (q) => q.eq("scenarioId", scenario._id))
          .count();

        return {
          ...scenario,
          nodeCount,
        };
      }),
    );

    return scenariosWithNodeCount;
  },
});

/**
 * Get a scenario by ID
 */
export const getScenario = query({
  args: {
    scenarioId: v.id("scenarios"),
  },
  returns: v.union(
    v.object({
      _id: v.id("scenarios"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.string(),
      status: v.string(),
      createdBy: v.id("users"),
      updatedAt: v.number(),
      lastRun: v.optional(v.number()),
      schedule: v.optional(
        v.object({
          frequency: v.string(),
          interval: v.number(),
          startTime: v.optional(v.number()),
          timezone: v.optional(v.string()),
          dayOfWeek: v.optional(v.number()),
          dayOfMonth: v.optional(v.number()),
        }),
      ),
      errorHandling: v.object({
        retryCount: v.number(),
        notifyOnError: v.boolean(),
      }),
      nodeCount: v.number(),
      user: v.object({
        _id: v.id("users"),
        name: v.string(),
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

    // Get the scenario
    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario) {
      return null;
    }

    // Check if the user has access to this scenario
    if (scenario.createdBy !== userId) {
      return null;
    }

    // Get the node count
    const nodeCount = await ctx.db
      .query("nodes")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.scenarioId))
      .count();

    // Get the user details
    const user = await ctx.db.get(scenario.createdBy);
    if (!user) {
      return null;
    }

    return {
      ...scenario,
      nodeCount,
      user: {
        _id: user._id,
        name: user.name,
      },
    };
  },
});

/**
 * Update a scenario
 */
export const updateScenario = mutation({
  args: {
    scenarioId: v.id("scenarios"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    schedule: v.optional(
      v.union(
        v.object({
          frequency: v.union(
            v.literal("minutes"),
            v.literal("hourly"),
            v.literal("daily"),
            v.literal("weekly"),
            v.literal("monthly"),
          ),
          interval: v.number(),
          startTime: v.optional(v.number()),
          timezone: v.optional(v.string()),
          dayOfWeek: v.optional(v.number()),
          dayOfMonth: v.optional(v.number()),
        }),
        v.null(),
      ),
    ),
    errorHandling: v.optional(
      v.object({
        retryCount: v.number(),
        notifyOnError: v.boolean(),
      }),
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
          error: "You don't have permission to modify this scenario",
        };
      }

      // Build the update object
      const updateObj: Record<string, unknown> = {
        updatedAt: Date.now(),
      };

      if (args.name !== undefined) updateObj.name = args.name;
      if (args.description !== undefined)
        updateObj.description = args.description;
      if (args.schedule !== undefined) {
        updateObj.schedule = args.schedule ?? undefined;
      }
      if (args.errorHandling !== undefined)
        updateObj.errorHandling = args.errorHandling;

      // Update the scenario
      await ctx.db.patch(args.scenarioId, updateObj);

      // Log the scenario update event
      await ctx.db.insert("audit_logs", {
        action: SCENARIO_AUDIT_EVENTS.SCENARIO_UPDATE,
        resourceType: "scenario",
        resourceId: args.scenarioId.toString(),
        userId,
        timestamp: Date.now(),
        metadata: {
          scenarioId: args.scenarioId,
          updatedFields: Object.keys(updateObj).filter(
            (key) => key !== "updatedAt",
          ),
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error updating scenario";
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});

/**
 * Delete a scenario
 */
export const deleteScenario = mutation({
  args: {
    scenarioId: v.id("scenarios"),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get the user ID
      const userId = await requireUserId(ctx);

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
          error: "You don't have permission to delete this scenario",
        };
      }

      // Get all nodes for this scenario
      const nodes = await ctx.db
        .query("nodes")
        .withIndex("by_scenario", (q) => q.eq("scenarioId", args.scenarioId))
        .collect();

      // Delete all nodes
      for (const node of nodes) {
        await ctx.db.delete(node._id);
      }

      // Delete the scenario
      await ctx.db.delete(args.scenarioId);

      // Log the scenario deletion event
      await ctx.db.insert("audit_logs", {
        action: SCENARIO_AUDIT_EVENTS.SCENARIO_DELETE,
        resourceType: "scenario",
        resourceId: args.scenarioId.toString(),
        userId,
        timestamp: Date.now(),
        metadata: {
          scenarioId: args.scenarioId,
          name: scenario.name,
          nodeCount: nodes.length,
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error deleting scenario";
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});

/**
 * Change the status of a scenario (activate, pause, etc.)
 */
export const changeScenarioStatus = mutation({
  args: {
    scenarioId: v.id("scenarios"),
    status: v.union(
      v.literal("active"),
      v.literal("draft"),
      v.literal("paused"),
      v.literal("error"),
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
          error: "You don't have permission to modify this scenario",
        };
      }

      // If status is not changing, do nothing
      if (scenario.status === args.status) {
        return { success: true };
      }

      // If activating a scenario, check if it has a trigger node
      if (args.status === "active") {
        const nodes = await ctx.db
          .query("nodes")
          .withIndex("by_scenario", (q) => q.eq("scenarioId", args.scenarioId))
          .collect();

        const hasTrigger = nodes.some((node) => node.type === "trigger");
        if (!hasTrigger) {
          return {
            success: false,
            error:
              "Scenario must have at least one trigger node to be activated",
          };
        }
      }

      // Update the scenario status
      await ctx.db.patch(args.scenarioId, {
        status: args.status,
        updatedAt: Date.now(),
      });

      // Determine which audit event to log
      let auditAction = SCENARIO_AUDIT_EVENTS.SCENARIO_UPDATE;
      if (args.status === "active") {
        auditAction = SCENARIO_AUDIT_EVENTS.SCENARIO_ACTIVATE;
      } else if (args.status === "paused") {
        auditAction = SCENARIO_AUDIT_EVENTS.SCENARIO_PAUSE;
      }

      // Log the status change event
      await ctx.db.insert("audit_logs", {
        action: auditAction,
        resourceType: "scenario",
        resourceId: args.scenarioId.toString(),
        userId,
        timestamp: Date.now(),
        metadata: {
          scenarioId: args.scenarioId,
          oldStatus: scenario.status,
          newStatus: args.status,
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error changing scenario status";
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});
