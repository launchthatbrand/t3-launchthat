import { v } from "convex/values";

import { Doc, Id } from "../../_generated/dataModel";
import { query } from "../../_generated/server";

/**
 * List all connections, optionally filtered by app or owner
 */
export const list = query({
  args: {
    appId: v.optional(v.id("apps")),
    status: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("connections"),
      _creationTime: v.number(),
      appId: v.id("apps"),
      name: v.string(),
      status: v.string(),
      credentials: v.string(),
      config: v.optional(v.string()),
      lastCheckedAt: v.optional(v.number()),
      lastError: v.optional(v.string()),
      ownerId: v.union(v.id("users"), v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
      app: v.optional(
        v.object({
          _id: v.id("apps"),
          name: v.string(),
          description: v.string(),
          authType: v.string(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    // Start with a base query
    const baseQuery = ctx.db.query("connections");

    // Apply filters based on provided arguments
    let filteredConnections;

    if (args.appId !== undefined && args.status !== undefined) {
      // Both appId and status provided
      filteredConnections = await baseQuery
        .filter((q) =>
          q.and(
            q.eq(q.field("appId"), args.appId),
            q.eq(q.field("status"), args.status),
          ),
        )
        .collect();
    } else if (args.appId !== undefined) {
      // Only appId provided
      filteredConnections = await baseQuery
        .filter((q) => q.eq(q.field("appId"), args.appId))
        .collect();
    } else if (args.status !== undefined) {
      // Only status provided
      filteredConnections = await baseQuery
        .filter((q) => q.eq(q.field("status"), args.status))
        .collect();
    } else {
      // No filters provided
      filteredConnections = await baseQuery.collect();
    }

    // Enrich the connections with app data
    const appIds = new Set(filteredConnections.map((conn) => conn.appId));
    const appsPromises = Array.from(appIds).map((appId) => ctx.db.get(appId));
    const apps = await Promise.all(appsPromises);

    // Create a map of app data for quick lookup
    const appMap = new Map<Id<"apps">, Doc<"apps">>();
    for (const app of apps) {
      if (app) {
        appMap.set(app._id, app);
      }
    }

    // Return the connections with app data
    return filteredConnections.map((conn) => {
      const app = appMap.get(conn.appId);
      return {
        ...conn,
        app: app
          ? {
              _id: app._id,
              name: app.name,
              description: app.description,
              authType: app.authType,
            }
          : undefined,
      };
    });
  },
});

/**
 * Get a specific connection by ID
 */
export const get = query({
  args: {
    id: v.id("connections"),
  },
  returns: v.union(
    v.object({
      _id: v.id("connections"),
      _creationTime: v.number(),
      appId: v.id("apps"),
      name: v.string(),
      status: v.string(),
      credentials: v.string(),
      config: v.optional(v.string()),
      lastCheckedAt: v.optional(v.number()),
      lastError: v.optional(v.string()),
      ownerId: v.union(v.id("users"), v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
      app: v.union(
        v.object({
          _id: v.id("apps"),
          name: v.string(),
          description: v.string(),
          authType: v.string(),
        }),
        v.null(),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.id);

    if (!connection) {
      return null;
    }

    // Get the app data
    const app = await ctx.db.get(connection.appId);

    return {
      ...connection,
      app: app
        ? {
            _id: app._id,
            name: app.name,
            description: app.description,
            authType: app.authType,
          }
        : null,
    };
  },
});
