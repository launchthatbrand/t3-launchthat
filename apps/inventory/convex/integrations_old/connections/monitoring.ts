import { cronJobs } from "convex/server";
/**
 * Connection monitoring for the integrations module
 *
 * This file provides functions for monitoring connections to third-party services,
 * including scheduled health checks and status updates.
 */
import { v } from "convex/values";

import { internal } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "../../_generated/server";
import { CONNECTION_STATUS } from "../lib/validators";

/**
 * Schedule periodic checks for all active connections
 */
const crons = cronJobs();

// Check connection health every 6 hours
crons.interval(
  "check connection health",
  { hours: 6 },
  internal.integrations.connections.monitoring.checkAllConnectionsHealth,
  {},
);

// Mark inactive connections as disconnected after 30 days of no use
// Run once every 24 hours
crons.interval(
  "mark inactive connections",
  { hours: 24 },
  internal.integrations.connections.monitoring.markInactiveConnections,
  {},
);

export default crons;

/**
 * Check the health of all active connections
 */
export const checkAllConnectionsHealth = internalAction({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    // Get all active connections
    const connections = await ctx.runQuery(getActiveConnections, {});

    let checkedCount = 0;

    // Check each connection
    for (const connection of connections) {
      try {
        // Check connection health based on auth type
        const app = await ctx.runQuery(
          internal.integrations.connections.management.getAppById,
          {
            appId: connection.appId,
          },
        );

        if (!app) {
          // If app doesn't exist, mark as error
          await ctx.runMutation(
            internal.integrations.connections.management.updateConnectionStatus,
            {
              connectionId: connection._id,
              status: CONNECTION_STATUS.ERROR,
              error: "Associated app not found",
            },
          );
          continue;
        }

        if (app.authType === "oauth2") {
          // For OAuth2, check if token needs refresh
          const credentials = connection.credentials as { encrypted?: string };
          if (!credentials.encrypted) {
            await ctx.runMutation(
              internal.integrations.connections.management
                .updateConnectionStatus,
              {
                connectionId: connection._id,
                status: CONNECTION_STATUS.ERROR,
                error: "Missing credentials",
              },
            );
            continue;
          }

          // Attempt to refresh the token if needed
          const refreshResult = await ctx.runAction(
            internal.integrations.connections.oauth.refreshOAuthToken,
            {
              connectionId: connection._id,
            },
          );

          if (!refreshResult.success) {
            await ctx.runMutation(
              internal.integrations.connections.management
                .updateConnectionStatus,
              {
                connectionId: connection._id,
                status: CONNECTION_STATUS.ERROR,
                error: refreshResult.error || "Failed to refresh token",
              },
            );
          }
        }

        // Log the health check
        await ctx.runMutation(
          internal.integrations.connections.management.logConnectionTest,
          {
            connectionId: connection._id,
            success: true,
          },
        );

        checkedCount++;
      } catch (error) {
        // Log error but continue checking other connections
        console.error(`Error checking connection ${connection._id}:`, error);
      }
    }

    return checkedCount;
  },
});

/**
 * Mark connections as disconnected if they haven't been used in 30 days
 */
export const markInactiveConnections = internalAction({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    // Get all active connections that haven't been used in 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const connections = await ctx.runQuery(getInactiveConnections, {
      cutoffTime: thirtyDaysAgo,
    });

    let markedCount = 0;

    // Mark each inactive connection as disconnected
    for (const connection of connections) {
      try {
        await ctx.runMutation(
          internal.integrations.connections.management.updateConnectionStatus,
          {
            connectionId: connection._id,
            status: CONNECTION_STATUS.DISCONNECTED,
            error: "Connection inactive for 30 days",
          },
        );

        markedCount++;
      } catch (error) {
        // Log error but continue processing other connections
        console.error(
          `Error marking connection ${connection._id} as inactive:`,
          error,
        );
      }
    }

    return markedCount;
  },
});

/**
 * Get all active connections
 */
export const getActiveConnections = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("connections"),
      appId: v.id("apps"),
      credentials: v.object({}),
      lastUsed: v.number(),
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db
      .query("connections")
      .withIndex("by_status", (q) => q.eq("status", CONNECTION_STATUS.ACTIVE))
      .collect();
  },
});

/**
 * Get inactive connections (active but not used since cutoff time)
 */
export const getInactiveConnections = internalQuery({
  args: {
    cutoffTime: v.number(),
  },
  returns: v.array(
    v.object({
      _id: v.id("connections"),
      appId: v.id("apps"),
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("connections")
      .withIndex("by_status", (q) => q.eq("status", CONNECTION_STATUS.ACTIVE))
      .filter((q) => q.lt(q.field("lastUsed"), args.cutoffTime))
      .collect();
  },
});
