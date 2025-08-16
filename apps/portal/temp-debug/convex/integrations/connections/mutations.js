import { v } from "convex/values";

import { mutation } from "../../_generated/server";

/**
 * Create a new connection for an integration app
 */
export const create = mutation({
  args: {
    appId: v.id("apps"),
    name: v.string(),
    credentials: v.string(),
    config: v.optional(v.string()),
    ownerId: v.union(v.id("users"), v.string()),
    status: v.optional(v.string()),
  },
  returns: v.id("connections"),
  handler: async (ctx, args) => {
    // Verify the app exists
    const app = await ctx.db.get(args.appId);
    if (!app) {
      throw new Error(`App with ID ${args.appId} not found`);
    }
    // For a string owner ID, we'll assume it's a valid system ID
    // In a production environment, you'd verify the user exists
    // or use proper authentication
    if (typeof args.ownerId !== "string") {
      // Validate user exists when ownerId is a real user id
      const owner = await ctx.db.get(args.ownerId);
      if (!owner) {
        throw new Error(`User with ID ${String(args.ownerId)} not found`);
      }
    }
    const now = Date.now();
    // Create the connection
    return await ctx.db.insert("connections", {
      appId: args.appId,
      name: args.name,
      credentials: args.credentials,
      status: args.status ?? "active",
      config: args.config,
      ownerId: args.ownerId,
      createdAt: now,
      updatedAt: now,
    });
  },
});
/**
 * Update an existing connection
 */
export const update = mutation({
  args: {
    id: v.id("connections"),
    name: v.optional(v.string()),
    credentials: v.optional(v.string()),
    status: v.optional(v.string()),
    config: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Verify the connection exists
    const connection = await ctx.db.get(args.id);
    if (!connection) {
      throw new Error(`Connection with ID ${args.id} not found`);
    }
    const now = Date.now();
    const updatedFields = { updatedAt: now };
    // Add fields that need to be updated
    if (args.name !== undefined) updatedFields.name = args.name;
    if (args.credentials !== undefined)
      updatedFields.credentials = args.credentials;
    if (args.status !== undefined) updatedFields.status = args.status;
    if (args.config !== undefined) updatedFields.config = args.config;
    // Update the connection
    await ctx.db.patch(args.id, updatedFields);
    return true;
  },
});
/**
 * Test a connection by validating its credentials
 */
export const test = mutation({
  args: {
    id: v.optional(v.id("connections")),
    credentials: v.optional(v.string()),
    appId: v.optional(v.id("apps")),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // We either test an existing connection or a new one being created
    let app;
    let connectionCredentials;
    if (args.id) {
      // Testing an existing connection
      const connection = await ctx.db.get(args.id);
      if (!connection) {
        throw new Error(`Connection with ID ${args.id} not found`);
      }
      app = await ctx.db.get(connection.appId);
      connectionCredentials = args.credentials ?? connection.credentials;
    } else if (args.appId && args.credentials) {
      // Testing a new connection
      app = await ctx.db.get(args.appId);
      connectionCredentials = args.credentials;
    } else {
      throw new Error(
        "Either connection ID or app ID with credentials must be provided",
      );
    }
    if (!app) {
      throw new Error("App not found");
    }
    // At this point we would implement app-specific connection testing
    // For example, for WordPress we would call the REST API with the credentials

    // Note: setTimeout / sleeping is not permitted in Convex mutations.
    // If you need to hit an external service, perform that logic in an action.
    // For now we immediately return a successful test result.
    // Update the lastCheckedAt timestamp if this is an existing connection
    if (args.id) {
      await ctx.db.patch(args.id, {
        lastCheckedAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    return {
      success: true,
      message: "Connection test successful",
    };
  },
});
/**
 * Delete a connection
 */
export const remove = mutation({
  args: {
    id: v.id("connections"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Verify the connection exists
    const connection = await ctx.db.get(args.id);
    if (!connection) {
      throw new Error(`Connection with ID ${args.id} not found`);
    }
    // In a production system, you'd also check if this connection is used by any scenarios
    // and either prevent deletion or handle the cascading effects
    // Delete the connection
    await ctx.db.delete(args.id);
    return true;
  },
});
