import { v } from "convex/values";
import { api } from "../../_generated/api";
import { internalQuery, query } from "../../_generated/server";
/**
 * List all connections, optionally filtered by app or owner
 */
export const list = query({
    args: {
        appId: v.optional(v.id("apps")),
        status: v.optional(v.string()),
    },
    returns: v.array(v.object({
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
        app: v.optional(v.object({
            _id: v.id("apps"),
            name: v.string(),
            description: v.string(),
            authType: v.string(),
        })),
    })),
    handler: async (ctx, args) => {
        // Start with a base query
        const baseQuery = ctx.db.query("connections");
        // Apply filters based on provided arguments
        let filteredConnections;
        if (args.appId !== undefined && args.status !== undefined) {
            // Both appId and status provided
            filteredConnections = await baseQuery
                .filter((q) => q.and(q.eq(q.field("appId"), args.appId), q.eq(q.field("status"), args.status)))
                .collect();
        }
        else if (args.appId !== undefined) {
            // Only appId provided
            filteredConnections = await baseQuery
                .filter((q) => q.eq(q.field("appId"), args.appId))
                .collect();
        }
        else if (args.status !== undefined) {
            // Only status provided
            filteredConnections = await baseQuery
                .filter((q) => q.eq(q.field("status"), args.status))
                .collect();
        }
        else {
            // No filters provided
            filteredConnections = await baseQuery.collect();
        }
        // Enrich the connections with app data
        const appIds = new Set(filteredConnections.map((conn) => conn.appId));
        const appsPromises = Array.from(appIds).map((appId) => ctx.db.get(appId));
        const apps = await Promise.all(appsPromises);
        // Create a map of app data for quick lookup
        const appMap = new Map();
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
    returns: v.union(v.object({
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
        app: v.union(v.object({
            _id: v.id("apps"),
            name: v.string(),
            description: v.string(),
            authType: v.string(),
        }), v.null()),
    }), v.null()),
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
            .withIndex("by_app_and_owner", (q) => q.eq("appId", args.appId).eq("ownerId", args.ownerId))
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
    returns: v.array(v.object({
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
        app: v.optional(v.object({
            _id: v.id("apps"),
            name: v.string(),
            description: v.string(),
            authType: v.string(),
        })),
    })),
    handler: async (ctx, args) => {
        // Get all connections using the existing logic
        const regularConnections = await ctx.runQuery(api.integrations.connections.queries.list, args);
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
                    _id: `${app._id}_default`, // Synthetic ID
                    _creationTime: app._creationTime,
                    appId: app._id,
                    name: `${app.name} (Default)`,
                    status: "connected",
                    credentials: JSON.stringify({ type: "internal" }),
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
                result.push(syntheticConnection);
            }
        }
        return result;
    },
});
