import type { Doc, Id } from "../../_generated/dataModel";
import { internalQuery, query } from "../../_generated/server";

import { api } from "../../_generated/api";
import { v } from "convex/values";

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
      // Never expose secrets on public queries
      metadata: v.optional(
        v.object({
          lastUsed: v.optional(v.number()),
          errorMessage: v.optional(v.string()),
          maskedCredentials: v.optional(v.record(v.string(), v.string())),
        }),
      ),
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

    // Apply filters based on provided arguments using proper indexes
    let filteredConnections;

    if (args.appId !== undefined && args.status !== undefined) {
      // Both appId and status provided - use composite index
      filteredConnections = await baseQuery
        .withIndex("by_app_and_status", (q) =>
          q.eq("appId", args.appId!).eq("status", args.status!),
        )
        .collect();
    } else if (args.appId !== undefined) {
      // Only appId provided - use existing index
      filteredConnections = await baseQuery
        .withIndex("by_app_id", (q) => q.eq("appId", args.appId!))
        .collect();
    } else if (args.status !== undefined) {
      // Only status provided - use existing index
      filteredConnections = await baseQuery
        .withIndex("by_status", (q) => q.eq("status", args.status!))
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

    // Return the connections with app data and without secrets
    return filteredConnections.map((conn) => {
      const app = appMap.get(conn.appId);
      const maskedFromLegacy = conn.credentials
        ? { token: `****${conn.credentials.slice(-4)}` }
        : undefined;

      return {
        _id: conn._id,
        _creationTime: conn._creationTime,
        appId: conn.appId,
        name: conn.name,
        status: conn.status,
        metadata: {
          lastUsed: conn.metadata?.lastUsed,
          errorMessage: conn.metadata?.errorMessage ?? conn.lastError,
          maskedCredentials:
            conn.metadata?.maskedCredentials ?? maskedFromLegacy,
        },
        config: conn.config,
        lastCheckedAt: conn.lastCheckedAt,
        lastError: conn.lastError,
        ownerId: conn.ownerId,
        createdAt: conn.createdAt,
        updatedAt: conn.updatedAt,
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
      metadata: v.optional(
        v.object({
          lastUsed: v.optional(v.number()),
          errorMessage: v.optional(v.string()),
          maskedCredentials: v.optional(v.record(v.string(), v.string())),
        }),
      ),
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

    const maskedFromLegacy = connection.credentials
      ? { token: `****${connection.credentials.slice(-4)}` }
      : undefined;

    return {
      _id: connection._id,
      _creationTime: connection._creationTime,
      appId: connection.appId,
      name: connection.name,
      status: connection.status,
      metadata: {
        lastUsed: connection.metadata?.lastUsed,
        errorMessage: connection.metadata?.errorMessage ?? connection.lastError,
        maskedCredentials:
          connection.metadata?.maskedCredentials ?? maskedFromLegacy,
      },
      config: connection.config,
      lastCheckedAt: connection.lastCheckedAt,
      lastError: connection.lastError,
      ownerId: connection.ownerId,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
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

export const getVimeoApp = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("apps")
      .filter((q) => q.eq(q.field("name"), "Vimeo"))
      .unique();
  },
});

export const getConnectionByAppAndOwner = internalQuery({
  args: {
    appId: v.id("apps"),
    ownerId: v.union(v.id("users"), v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("connections")
      .withIndex("by_app_and_owner", (q) =>
        q.eq("appId", args.appId).eq("ownerId", args.ownerId),
      )
      .unique();
  },
});

/**
 * List connections with automatic inclusion of internal app connections
 * This ensures internal apps show up with their default connections
 */
export const listWithInternalApps = query({
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
      metadata: v.optional(
        v.object({
          lastUsed: v.optional(v.number()),
          errorMessage: v.optional(v.string()),
          maskedCredentials: v.optional(v.record(v.string(), v.string())),
        }),
      ),
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
    // Get all connections using the existing logic
    const regularConnections = await ctx.runQuery(
      api.integrations.connections.queries.list,
      args,
    );

    // Get all internal apps that might not have connections yet
    const internalApps = await ctx.db
      .query("apps")
      .filter((q) => q.eq(q.field("isInternal"), true))
      .collect();

    const result = [...regularConnections];

    // For each internal app, ensure it has a connection in the result
    for (const app of internalApps) {
      // Skip if we already have a connection for this app in the results
      const hasConnection = result.some((conn) => conn.appId === app._id);

      if (!hasConnection) {
        // Create a synthetic connection for display purposes
        const syntheticConnection = {
          _id: `${app._id}_default` as any, // Synthetic ID
          _creationTime: app._creationTime,
          appId: app._id,
          name: `${app.name} (Default)`,
          status: "connected",
          metadata: {
            maskedCredentials: { token: "****internal" },
          },
          config: JSON.stringify({ isDefault: true }),
          ownerId: "system",
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
          app: {
            _id: app._id,
            name: app.name,
            description: app.description,
            authType: app.authType,
          },
        };

        result.push(syntheticConnection as any);
      }
    }

    return result;
  },
});
