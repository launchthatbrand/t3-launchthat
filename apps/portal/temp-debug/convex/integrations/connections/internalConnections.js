import { v } from "convex/values";
import { internal } from "../../_generated/api";
import { internalMutation, internalQuery, mutation, } from "../../_generated/server";
/**
 * Create default connections for internal apps
 * This is called when apps are seeded to ensure internal apps have their default connections
 */
export const createDefaultInternalConnections = internalMutation({
    args: {},
    returns: v.object({
        connectionsCreated: v.number(),
        errors: v.array(v.string()),
    }),
    handler: async (ctx) => {
        let connectionsCreated = 0;
        const errors = [];
        try {
            // Get all internal apps
            const internalApps = await ctx.db
                .query("apps")
                .filter((q) => q.eq(q.field("isInternal"), true))
                .collect();
            console.log(`Found ${internalApps.length} internal apps`);
            // Get all existing connections to avoid duplicates
            const existingConnections = await ctx.db.query("connections").collect();
            const existingConnectionsByApp = new Map();
            for (const conn of existingConnections) {
                if (!existingConnectionsByApp.has(conn.appId)) {
                    existingConnectionsByApp.set(conn.appId, []);
                }
                existingConnectionsByApp.get(conn.appId).push(conn);
            }
            const now = Date.now();
            for (const app of internalApps) {
                try {
                    // Check if this internal app already has a default connection
                    const existingAppConnections = existingConnectionsByApp.get(app._id) || [];
                    const hasDefaultConnection = existingAppConnections.some((conn) => conn.name === `${app.name} (Default)` || conn.name === app.name);
                    if (!hasDefaultConnection) {
                        // Create a default connection for this internal app
                        const connectionName = `${app.name} (Default)`;
                        // For internal apps, we don't need real credentials, just a placeholder
                        const defaultCredentials = JSON.stringify({
                            type: "internal",
                            appName: app.name,
                            created: now,
                        });
                        const defaultConfig = JSON.stringify({
                            enabled: true,
                            isDefault: true,
                            createdBy: "system",
                        });
                        await ctx.db.insert("connections", {
                            appId: app._id,
                            name: connectionName,
                            credentials: defaultCredentials,
                            status: "connected",
                            config: defaultConfig,
                            ownerId: "system", // System-owned connection
                            createdAt: now,
                            updatedAt: now,
                        });
                        connectionsCreated++;
                        console.log(`Created default connection for ${app.name}`);
                    }
                    else {
                        console.log(`Default connection already exists for ${app.name}`);
                    }
                }
                catch (error) {
                    const errorMsg = `Failed to create connection for ${app.name}: ${error}`;
                    console.error(errorMsg);
                    errors.push(errorMsg);
                }
            }
            return {
                connectionsCreated,
                errors,
            };
        }
        catch (error) {
            console.error("Error in createDefaultInternalConnections:", error);
            errors.push(`General error: ${error}`);
            return {
                connectionsCreated,
                errors,
            };
        }
    },
});
/**
 * Get existing default connection for an internal app
 * This only reads, doesn't create - use createDefaultInternalConnections for creation
 */
export const getInternalConnection = internalQuery({
    args: {
        appId: v.id("apps"),
    },
    returns: v.union(v.object({
        _id: v.id("connections"),
        _creationTime: v.number(),
        appId: v.id("apps"),
        name: v.string(),
        credentials: v.string(),
        status: v.string(),
        config: v.optional(v.string()),
        lastCheckedAt: v.optional(v.number()),
        lastError: v.optional(v.string()),
        ownerId: v.union(v.id("users"), v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
    }), v.null()),
    handler: async (ctx, args) => {
        // First check if the app is internal
        const app = await ctx.db.get(args.appId);
        if (!app || !app.isInternal) {
            return null;
        }
        // Look for existing default connection
        const existingConnection = await ctx.db
            .query("connections")
            .withIndex("by_app_id", (q) => q.eq("appId", args.appId))
            .filter((q) => q.eq(q.field("ownerId"), "system"))
            .first();
        return existingConnection;
    },
});
/**
 * Test function to manually trigger internal connections creation
 */
export const testCreateInternalConnections = mutation({
    args: {},
    returns: v.object({
        connectionsCreated: v.number(),
        errors: v.array(v.string()),
    }),
    handler: async (ctx) => {
        return await ctx.runMutation(internal.integrations.connections.internalConnections
            .createDefaultInternalConnections, {});
    },
});
