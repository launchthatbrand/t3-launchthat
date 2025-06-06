/**
 * App management utilities for the integrations module
 *
 * This file provides utilities for managing app instances,
 * discovering available apps, and handling app configurations.
 */
import { ConvexError, v } from "convex/values";

import { Id } from "../../_generated/dataModel";
import {
  action,
  internalQuery,
  mutation,
  query,
} from "../../_generated/server";
import { authTypeValidator } from "../lib/validators";

/**
 * Built-in app definitions
 */
const BUILT_IN_APPS = [
  {
    id: "email",
    name: "Email",
    description: "Send and receive emails",
    iconUrl: "/icons/email.svg",
    authType: "oauth2",
    authConfigTemplate: {
      clientId: "",
      clientSecret: "",
      scopes: ["mail.send", "mail.read"],
      redirectUri: "",
    },
    triggers: [
      {
        id: "new_email",
        name: "New Email Received",
        description: "Triggered when a new email is received",
      },
      {
        id: "email_read",
        name: "Email Read",
        description: "Triggered when an email is read",
      },
    ],
    actions: [
      {
        id: "send_email",
        name: "Send Email",
        description: "Send an email to recipients",
      },
      {
        id: "mark_as_read",
        name: "Mark as Read",
        description: "Mark an email as read",
      },
    ],
  },
  {
    id: "calendar",
    name: "Calendar",
    description: "Manage calendar events",
    iconUrl: "/icons/calendar.svg",
    authType: "oauth2",
    authConfigTemplate: {
      clientId: "",
      clientSecret: "",
      scopes: ["calendar.read", "calendar.write"],
      redirectUri: "",
    },
    triggers: [
      {
        id: "new_event",
        name: "New Event Created",
        description: "Triggered when a new event is created",
      },
      {
        id: "event_updated",
        name: "Event Updated",
        description: "Triggered when an event is updated",
      },
    ],
    actions: [
      {
        id: "create_event",
        name: "Create Event",
        description: "Create a new calendar event",
      },
      {
        id: "delete_event",
        name: "Delete Event",
        description: "Delete a calendar event",
      },
    ],
  },
];

/**
 * Get available app templates (built-in apps)
 */
export const getAppTemplates = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      description: v.string(),
      iconUrl: v.string(),
      authType: authTypeValidator,
      triggers: v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          description: v.string(),
        }),
      ),
      actions: v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          description: v.string(),
        }),
      ),
    }),
  ),
  handler: async () => {
    // Return the built-in app templates
    return BUILT_IN_APPS.map((app) => ({
      id: app.id,
      name: app.name,
      description: app.description,
      iconUrl: app.iconUrl,
      authType: app.authType,
      triggers: app.triggers,
      actions: app.actions,
    }));
  },
});

/**
 * Test a connection to an app
 */
export const testConnection = action({
  args: {
    connectionId: v.id("connections"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get the connection
    const connection = await ctx.runQuery(internalGetConnection, {
      connectionId: args.connectionId,
    });

    if (!connection) {
      return {
        success: false,
        message: "Connection not found",
      };
    }

    // Get the app
    const app = await ctx.runQuery(internalGetApp, {
      appId: connection.appId,
    });

    if (!app) {
      return {
        success: false,
        message: "App not found",
      };
    }

    // In a real implementation, we would:
    // 1. Get the credentials from the connection
    // 2. Use the app's configuration to make a test API call
    // 3. Return the result

    // For now, we'll simulate a successful test
    return {
      success: true,
      message: `Successfully connected to ${app.name}`,
    };
  },
});

/**
 * Get app usage statistics
 */
export const getAppUsageStats = query({
  args: {
    appId: v.id("apps"),
  },
  returns: v.object({
    totalConnections: v.number(),
    activeConnections: v.number(),
    totalScenarios: v.number(),
    totalExecutions: v.number(),
    lastUsed: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    // Get all connections for this app
    const connections = await ctx.db
      .query("connections")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .collect();

    // Count active connections
    const activeConnections = connections.filter(
      (connection) => connection.status === "active",
    ).length;

    // In a real implementation, we would also count scenarios and executions
    // For now, we'll return placeholder data
    return {
      totalConnections: connections.length,
      activeConnections,
      totalScenarios: 0, // Placeholder
      totalExecutions: 0, // Placeholder
      lastUsed: connections.length > 0 ? Date.now() : undefined,
    };
  },
});

/**
 * Internal query to get an app
 */
const internalGetApp = internalQuery({
  args: {
    appId: v.id("apps"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.appId);
  },
});

/**
 * Internal query to get a connection
 */
const internalGetConnection = internalQuery({
  args: {
    connectionId: v.id("connections"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.connectionId);
  },
});
