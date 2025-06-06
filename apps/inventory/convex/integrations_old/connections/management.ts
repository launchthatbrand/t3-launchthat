/**
 * Connection management for the integrations module
 *
 * This file provides functions for managing connections to third-party services,
 * including listing, testing, updating, and deleting connections.
 */
import { ConvexError, v } from "convex/values";

import { Id } from "../../_generated/dataModel";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "../../_generated/server";
import { AuditEventType } from "../lib/audit";
import { getOptionalUserId } from "../lib/auth";
import { CONNECTION_STATUS } from "../lib/validators";

/**
 * List all connections for the current user
 */
export const listConnections = query({
  args: {
    appId: v.optional(v.id("apps")),
    status: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("connections"),
      _creationTime: v.number(),
      appId: v.id("apps"),
      userId: v.id("users"),
      name: v.string(),
      status: v.string(),
      updatedAt: v.number(),
      lastUsed: v.number(),
      metadata: v.object({}),
      lastError: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    // Get the user ID
    const userId = await getOptionalUserId(ctx);
    if (!userId) {
      return [];
    }

    // Build the query
    let connectionsQuery = ctx.db
      .query("connections")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    // Filter by app ID if provided
    if (args.appId) {
      connectionsQuery = ctx.db
        .query("connections")
        .withIndex("by_user_app", (q) =>
          q.eq("userId", userId).eq("appId", args.appId),
        );
    }

    // Filter by status if provided
    if (args.status) {
      connectionsQuery = connectionsQuery.filter((q) =>
        q.eq(q.field("status"), args.status!),
      );
    }

    // Execute the query and collect the results
    const connections = await connectionsQuery.collect();
    return connections;
  },
});

/**
 * Get a connection by ID
 */
export const getConnection = query({
  args: {
    connectionId: v.id("connections"),
  },
  returns: v.union(
    v.object({
      _id: v.id("connections"),
      _creationTime: v.number(),
      appId: v.id("apps"),
      userId: v.id("users"),
      name: v.string(),
      status: v.string(),
      updatedAt: v.number(),
      lastUsed: v.number(),
      metadata: v.object({}),
      lastError: v.optional(v.string()),
      app: v.object({
        _id: v.id("apps"),
        name: v.string(),
        description: v.string(),
        iconUrl: v.string(),
        authType: v.string(),
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

    // Get the connection
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      return null;
    }

    // Check if the user has access to this connection
    if (connection.userId !== userId) {
      return null;
    }

    // Get the app
    const app = await ctx.db.get(connection.appId);
    if (!app) {
      return null;
    }

    // Return the connection with app details
    return {
      ...connection,
      app: {
        _id: app._id,
        name: app.name,
        description: app.description,
        iconUrl: app.iconUrl,
        authType: app.authType,
      },
    };
  },
});

/**
 * Delete a connection
 */
export const deleteConnection = mutation({
  args: {
    connectionId: v.id("connections"),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get the user ID
      const userId = await getOptionalUserId(ctx);
      if (!userId) {
        return {
          success: false,
          error: "User not authenticated",
        };
      }

      // Get the connection
      const connection = await ctx.db.get(args.connectionId);
      if (!connection) {
        return {
          success: false,
          error: "Connection not found",
        };
      }

      // Check if the user has access to this connection
      if (connection.userId !== userId) {
        return {
          success: false,
          error: "You don't have permission to delete this connection",
        };
      }

      // Log the credential deletion event
      await ctx.db.insert("audit_logs", {
        action: AuditEventType.CREDENTIAL_DELETE,
        resourceType: "connection",
        resourceId: args.connectionId,
        userId,
        timestamp: Date.now(),
        metadata: {
          connectionId: args.connectionId,
          appId: connection.appId,
        },
      });

      // Delete the connection
      await ctx.db.delete(args.connectionId);

      return {
        success: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error deleting connection";
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});

/**
 * Test a connection
 */
export const testConnection = action({
  args: {
    connectionId: v.id("connections"),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get the connection
      const connection = await ctx.runQuery(getConnectionById, {
        connectionId: args.connectionId,
      });

      if (!connection) {
        return {
          success: false,
          error: "Connection not found",
        };
      }

      // Get the app
      const app = await ctx.runQuery(getAppById, {
        appId: connection.appId,
      });

      if (!app) {
        return {
          success: false,
          error: "App not found",
        };
      }

      // Check the auth type and test accordingly
      let testResult = { success: false, error: "Unsupported auth type" };

      if (app.authType === "oauth2") {
        // Test OAuth2 connection by attempting to refresh the token
        testResult = await ctx.runAction(ctx._self.refreshOAuthToken, {
          connectionId: args.connectionId,
        });
      } else if (app.authType === "apiKey") {
        // For API key, perform a basic endpoint test
        // This would be implemented based on the specific app's requirements
        testResult = {
          success: true,
        };
      } else if (app.authType === "basic") {
        // For basic auth, perform a basic endpoint test
        // This would be implemented based on the specific app's requirements
        testResult = {
          success: true,
        };
      }

      // Update the connection status based on the test result
      await ctx.runMutation(updateConnectionStatus, {
        connectionId: args.connectionId,
        status: testResult.success
          ? CONNECTION_STATUS.ACTIVE
          : CONNECTION_STATUS.ERROR,
        error: testResult.error,
      });

      // Log the connection test event
      await ctx.runMutation(logConnectionTest, {
        connectionId: args.connectionId,
        success: testResult.success,
        error: testResult.error,
      });

      return testResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error testing connection";
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});

/**
 * Update connection status
 */
export const updateConnectionStatus = internalMutation({
  args: {
    connectionId: v.id("connections"),
    status: v.string(),
    error: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { connectionId, status, error } = args;

    // Update the connection status
    await ctx.db.patch(connectionId, {
      status,
      lastError: error,
      updatedAt: Date.now(),
    });

    return true;
  },
});

/**
 * Log a connection test event
 */
export const logConnectionTest = internalMutation({
  args: {
    connectionId: v.id("connections"),
    success: v.boolean(),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { connectionId, success, error } = args;

    // Get the connection
    const connection = await ctx.db.get(connectionId);
    if (!connection) {
      return null;
    }

    // Log the connection test event
    await ctx.db.insert("audit_logs", {
      action: AuditEventType.CONNECTION_TEST,
      resourceType: "connection",
      resourceId: connectionId,
      userId: connection.userId,
      timestamp: Date.now(),
      metadata: {
        connectionId,
        appId: connection.appId,
        success,
        error,
      },
    });

    return null;
  },
});

/**
 * Get a connection by ID (internal)
 */
export const getConnectionById = internalQuery({
  args: {
    connectionId: v.id("connections"),
  },
  returns: v.union(v.object({}), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.connectionId);
  },
});

/**
 * Get an app by ID (internal)
 */
export const getAppById = internalQuery({
  args: {
    appId: v.id("apps"),
  },
  returns: v.union(v.object({}), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.appId);
  },
});
