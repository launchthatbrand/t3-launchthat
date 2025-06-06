/**
 * Trigger mechanisms for integration scenarios
 *
 * This file provides functions for managing triggers in integration scenarios,
 * including webhook handling and polling mechanisms.
 */

import { ConvexError, v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";
import { Doc } from "../../_generated/dataModel";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "../../_generated/server";
import { getOptionalUserId, requireUserId } from "../lib/auth";

// Define trigger types
export const TriggerType = {
  WEBHOOK: "webhook",
  POLLING: "polling",
  SCHEDULED: "scheduled",
} as const;

export type TriggerTypeEnum = (typeof TriggerType)[keyof typeof TriggerType];

// Define trigger-specific audit event types
const TRIGGER_AUDIT_EVENTS = {
  WEBHOOK_RECEIVED: "webhook_received",
  WEBHOOK_PROCESSED: "webhook_processed",
  POLLING_EXECUTED: "polling_executed",
  TRIGGER_ERROR: "trigger_error",
  WEBHOOK_GENERATED: "webhook_generated",
  POLLING_CONFIGURED: "polling_configured",
};

/**
 * Process a webhook payload from an external service
 *
 * This function is called by the webhook API route when a webhook is received.
 * It validates the webhook token, processes the payload, and initiates the scenario execution.
 */
export const processWebhook = mutation({
  args: {
    nodeId: v.string(),
    token: v.string(),
    headers: v.record(v.string(), v.string()),
    body: v.any(),
    method: v.string(),
    timestamp: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Validate the node ID format
      let nodeId: Id<"nodes">;
      try {
        nodeId = args.nodeId as Id<"nodes">;
      } catch (_) {
        return {
          success: false,
          error: "Invalid node ID format",
        };
      }

      // Get the node
      const node = await ctx.db.get(nodeId);
      if (!node) {
        return {
          success: false,
          error: "Node not found",
        };
      }

      // Verify the node is a trigger node
      if (node.type !== "trigger") {
        return {
          success: false,
          error: "Node is not a trigger node",
        };
      }

      // Get the trigger configuration
      const triggerConfig = node.config?.trigger;
      if (!triggerConfig) {
        return {
          success: false,
          error: "Node is not configured as a trigger",
        };
      }

      // Verify the trigger type is webhook
      if (triggerConfig.type !== TriggerType.WEBHOOK) {
        return {
          success: false,
          error: "Node is not configured as a webhook trigger",
        };
      }

      // Verify the webhook token
      if (triggerConfig.webhookToken !== args.token) {
        // Log the invalid token attempt
        console.error("Invalid webhook token");
        return {
          success: false,
          error: "Invalid webhook token",
        };
      }

      // Log the webhook received event
      console.log("Webhook received", {
        nodeId: node._id,
        method: args.method,
        timestamp: args.timestamp,
      });

      // Get the scenario ID from the node
      const scenarioId = node.scenarioId;

      // In a real implementation, we would:
      // 1. Insert a new execution record
      // 2. Trigger the scenario execution
      // 3. Return the execution ID

      // For now, just log and return success
      console.log("Processing webhook", {
        scenarioId,
        nodeId: node._id,
        method: args.method,
        timestamp: args.timestamp,
      });

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error processing webhook:", error);

      // Return error
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error processing webhook",
      };
    }
  },
});

/**
 * Generate a webhook URL for a trigger node
 */
export const generateWebhookUrl = mutation({
  args: {
    nodeId: v.id("nodes"),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    webhookUrl: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get the node
      const node = await ctx.db.get(args.nodeId);
      if (!node) {
        return {
          success: false,
          error: "Node not found",
        };
      }

      // Verify the node is a trigger node
      if (node.type !== "trigger") {
        return {
          success: false,
          error: "Node is not a trigger node",
        };
      }

      // Create or update the trigger configuration
      const webhookToken = crypto.randomUUID();

      const config = {
        ...node.config,
        trigger: {
          type: TriggerType.WEBHOOK,
          webhookToken,
          webhookEnabled: true,
          lastUpdated: Date.now(),
        },
      };

      // Update the node
      await ctx.db.patch(args.nodeId, {
        config,
      });

      // Return the webhook URL
      return {
        success: true,
        webhookUrl: `/api/integrations/webhook/${node._id}?token=${webhookToken}`,
      };
    } catch (error) {
      console.error("Error generating webhook URL:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Helper function to call logAuditEvent with proper parameters
 */
async function logTriggerAuditEvent(args: {
  event: string;
  userId: Id<"users"> | null;
  resourceType: string;
  resourceId: Id<any>;
  details: Record<string, any>;
}) {
  // This is a placeholder for the actual implementation
  // In a real implementation, this would call the logAuditEvent function
  console.log("Audit log:", args);
  return null;
}

/**
 * Get trigger node details for UI display
 */
export const getTriggerNodeDetails = query({
  args: {
    nodeId: v.id("nodes"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("nodes"),
      name: v.string(),
      scenarioId: v.id("scenarios"),
      triggerType: v.union(
        v.literal(TriggerType.WEBHOOK),
        v.literal(TriggerType.POLLING),
      ),
      webhookUrl: v.optional(v.string()),
      webhookEnabled: v.optional(v.boolean()),
      pollingInterval: v.optional(v.number()),
      pollingEnabled: v.optional(v.boolean()),
      lastPolled: v.optional(v.number()),
      app: v.optional(
        v.object({
          name: v.string(),
          iconUrl: v.optional(v.string()),
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
  ),
  handler: async (ctx, args) => {
    // Get the current user
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

    // Check if the user has access to the scenario
    if (scenario.userId !== userId) {
      return null;
    }

    // Verify the node is a trigger node
    if (node.type !== NodeType.TRIGGER) {
      return null;
    }

    // Get the trigger configuration
    const triggerConfig = node.config?.trigger;
    if (!triggerConfig) {
      return null;
    }

    // Get connection details if available
    let connection = null;
    if (node.config?.connectionId) {
      const connectionDoc = await ctx.db.get(
        node.config.connectionId as Id<"connections">,
      );
      if (connectionDoc) {
        connection = {
          _id: connectionDoc._id,
          name: connectionDoc.name,
          status: connectionDoc.status,
        };
      }
    }

    // Get app details if available
    let app = null;
    if (node.config?.appId) {
      const appDoc = await ctx.db.get(node.config.appId as Id<"apps">);
      if (appDoc) {
        app = {
          name: appDoc.name,
          iconUrl: appDoc.iconUrl,
        };
      }
    }

    // Build the response based on trigger type
    if (triggerConfig.type === TriggerType.WEBHOOK) {
      return {
        _id: node._id,
        name: node.name,
        scenarioId: node.scenarioId,
        triggerType: TriggerType.WEBHOOK,
        webhookUrl: triggerConfig.webhookToken
          ? `/api/integrations/webhook/${node._id}?token=${triggerConfig.webhookToken}`
          : undefined,
        webhookEnabled: triggerConfig.webhookEnabled,
        app,
        connection,
      };
    } else if (triggerConfig.type === TriggerType.POLLING) {
      return {
        _id: node._id,
        name: node.name,
        scenarioId: node.scenarioId,
        triggerType: TriggerType.POLLING,
        pollingInterval: triggerConfig.pollingInterval,
        pollingEnabled: triggerConfig.pollingEnabled,
        lastPolled: triggerConfig.lastPolled,
        app,
        connection,
      };
    }

    return null;
  },
});

/**
 * Setup polling trigger configuration
 */
export const setupPollingTrigger = mutation({
  args: {
    nodeId: v.id("nodes"),
    interval: v.number(),
    enabled: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Get the current user
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

    // Check if the user has access to the scenario
    if (scenario.userId !== userId) {
      return {
        success: false,
        error: "Access denied",
      };
    }

    // Verify the node is a trigger node
    if (node.type !== NodeType.TRIGGER) {
      return {
        success: false,
        error: "Node is not a trigger node",
      };
    }

    // Validate the polling interval
    if (args.interval < 1) {
      return {
        success: false,
        error: "Polling interval must be at least 1 minute",
      };
    }

    // Check if a connection is configured
    if (!node.config?.connectionId) {
      return {
        success: false,
        error: "No connection configured for this trigger",
      };
    }

    // Create or update the trigger configuration
    const config = {
      ...node.config,
      trigger: {
        type: TriggerType.POLLING,
        pollingInterval: args.interval,
        pollingEnabled: args.enabled,
        lastUpdated: Date.now(),
      },
    };

    // Update the node
    await ctx.db.patch(args.nodeId, {
      config,
    });

    // Log the polling configuration event
    await logTriggerAuditEvent({
      event: TRIGGER_AUDIT_EVENTS.POLLING_CONFIGURED,
      userId,
      resourceType: "nodes",
      resourceId: node._id,
      details: {
        scenarioId: node.scenarioId,
        interval: args.interval,
        enabled: args.enabled,
      },
    });

    return {
      success: true,
    };
  },
});

/**
 * List all active polling triggers
 * This is used by the cron job to find triggers that need to be polled
 */
export const listActivePollingTriggers = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("nodes"),
      scenarioId: v.id("scenarios"),
      pollingInterval: v.optional(v.number()),
      lastPolled: v.optional(v.number()),
      connectionId: v.optional(v.id("connections")),
    }),
  ),
  handler: async (ctx) => {
    // Query for nodes that are configured as polling triggers
    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_type", (q) => q.eq("type", NodeType.TRIGGER))
      .collect();

    // Filter for active polling triggers
    const pollingTriggers = nodes.filter((node) => {
      const triggerConfig = node.config?.trigger;
      return (
        triggerConfig?.type === TriggerType.POLLING &&
        triggerConfig?.pollingEnabled === true &&
        node.config?.connectionId !== undefined
      );
    });

    // Map to the required format
    return pollingTriggers.map((node) => ({
      _id: node._id,
      scenarioId: node.scenarioId,
      pollingInterval: node.config?.trigger?.pollingInterval,
      lastPolled: node.config?.trigger?.lastPolled,
      connectionId: node.config?.connectionId as Id<"connections">,
    }));
  },
});

/**
 * Execute a polling trigger
 * This is called by the cron job for each trigger that needs to be polled
 */
export const executePollingTrigger = internalAction({
  args: {
    nodeId: v.id("nodes"),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    executionId: v.optional(v.id("scenarioExecutions")),
  }),
  handler: async (ctx, args) => {
    try {
      // Get the node
      const node = await ctx.runQuery(
        internal.integrations.scenarios.nodes.getNodeById,
        {
          nodeId: args.nodeId,
        },
      );

      if (!node) {
        return {
          success: false,
          error: "Node not found",
        };
      }

      // Verify the node is a trigger node
      if (node.type !== NodeType.TRIGGER) {
        return {
          success: false,
          error: "Node is not a trigger node",
        };
      }

      // Get the trigger configuration
      const triggerConfig = node.config?.trigger;
      if (
        !triggerConfig ||
        triggerConfig.type !== TriggerType.POLLING ||
        !triggerConfig.pollingEnabled
      ) {
        return {
          success: false,
          error: "Node is not configured as an active polling trigger",
        };
      }

      // Get the connection
      if (!node.config?.connectionId) {
        return {
          success: false,
          error: "No connection configured for this trigger",
        };
      }

      const connectionId = node.config.connectionId as Id<"connections">;
      const connection = await ctx.runQuery(
        internal.integrations.connections.getConnectionById,
        {
          connectionId,
        },
      );

      if (!connection) {
        return {
          success: false,
          error: "Connection not found",
        };
      }

      // Check if the connection is active
      if (connection.status !== "active") {
        return {
          success: false,
          error: `Connection is not active (status: ${connection.status})`,
        };
      }

      // Update the last polled timestamp
      await ctx.runMutation(
        internal.integrations.scenarios.updateTriggerLastPolled,
        {
          nodeId: args.nodeId,
          timestamp: Date.now(),
        },
      );

      // Log the polling execution event
      await ctx.runMutation(internal.integrations.connections.logAuditEvent, {
        event: TRIGGER_AUDIT_EVENTS.POLLING_EXECUTED,
        userId: connection.userId,
        resourceType: "nodes",
        resourceId: node._id,
        details: {
          scenarioId: node.scenarioId,
          connectionId,
          timestamp: Date.now(),
        },
      });

      // Execute the polling logic and initiate the scenario execution
      // TODO: Replace with actual polling implementation
      // This would typically call the external API and check for changes

      // For now, we'll create a scenario execution record
      const executionId = await ctx.runMutation(
        internal.integrations.scenarios.createExecutionFromPoll,
        {
          nodeId: args.nodeId,
          scenarioId: node.scenarioId,
          connectionId,
          timestamp: Date.now(),
        },
      );

      return {
        success: true,
        executionId,
      };
    } catch (error) {
      console.error("Error executing polling trigger:", error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error executing polling trigger",
      };
    }
  },
});

/**
 * Update the last polled timestamp for a trigger node
 */
export const updateTriggerLastPolled = internalMutation({
  args: {
    nodeId: v.id("nodes"),
    timestamp: v.number(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Get the node
    const node = await ctx.db.get(args.nodeId);
    if (!node || node.type !== NodeType.TRIGGER) {
      return false;
    }

    // Get the current config
    const config = node.config || {};
    const trigger = config.trigger || {};

    // Only update if it's a polling trigger
    if (trigger.type !== TriggerType.POLLING) {
      return false;
    }

    // Update the last polled timestamp
    await ctx.db.patch(args.nodeId, {
      config: {
        ...config,
        trigger: {
          ...trigger,
          lastPolled: args.timestamp,
        },
      },
    });

    return true;
  },
});

/**
 * Create a scenario execution record from a polling trigger
 */
export const createExecutionFromPoll = internalMutation({
  args: {
    nodeId: v.id("nodes"),
    scenarioId: v.id("scenarios"),
    connectionId: v.id("connections"),
    timestamp: v.number(),
  },
  returns: v.id("scenarioExecutions"),
  handler: async (ctx, args) => {
    // Create a new execution record
    return await ctx.db.insert("scenarioExecutions", {
      scenarioId: args.scenarioId,
      triggerId: args.nodeId,
      triggerType: TriggerType.POLLING,
      status: "pending",
      startTime: args.timestamp,
      endTime: null,
      input: {
        connectionId: args.connectionId,
        timestamp: args.timestamp,
        source: "polling",
      },
      output: null,
      error: null,
    });
  },
});

/**
 * Get the webhook URL for a trigger node
 */
export const getNodeWebhookUrl = query({
  args: {
    nodeId: v.id("nodes"),
  },
  returns: v.union(v.null(), v.string()),
  handler: async (ctx, args) => {
    // Get the node
    const node = await ctx.db.get(args.nodeId);
    if (!node) {
      return null;
    }

    // Check if the node is a webhook trigger
    const triggerConfig = node.config?.trigger;
    if (
      !triggerConfig ||
      triggerConfig.type !== TriggerType.WEBHOOK ||
      !triggerConfig.webhookToken
    ) {
      return null;
    }

    // Return the webhook URL
    return `/api/integrations/webhook/${node._id}?token=${triggerConfig.webhookToken}`;
  },
});
