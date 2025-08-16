/* eslint-disable @typescript-eslint/restrict-template-expressions */

import type { Doc, Id } from "../../_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
} from "../../_generated/server";

import { internal } from "../../_generated/api";
import { v } from "convex/values";

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
    const errors: string[] = [];

    try {
      // Get all internal apps
      const internalApps = await ctx.db
        .query("apps")
        .filter((q) => q.eq(q.field("isInternal"), true))
        .collect();

      console.log(`Found ${internalApps.length} internal apps`);

      // Get all existing connections to avoid duplicates
      const existingConnections = await ctx.db.query("connections").collect();
      const existingConnectionsByApp = new Map<
        Id<"apps">,
        Doc<"connections">[]
      >();

      for (const conn of existingConnections) {
        const list = existingConnectionsByApp.get(conn.appId) ?? [];
        list.push(conn);
        existingConnectionsByApp.set(conn.appId, list);
      }

      const now = Date.now();

      for (const app of internalApps) {
        try {
          // Check if this internal app already has a default connection
          const existingAppConnections =
            existingConnectionsByApp.get(app._id) ?? [];
          const hasDefaultConnection = existingAppConnections.some(
            (conn) =>
              conn.name === `${app.name} (Default)` || conn.name === app.name,
          );

          if (!hasDefaultConnection) {
            // Create a default connection for this internal app
            const connectionName = `${app.name} (Default)`;

            const defaultConfig = JSON.stringify({
              enabled: true,
              isDefault: true,
              createdBy: "system",
            });

            await ctx.db.insert("connections", {
              appId: app._id,
              name: connectionName,
              // do not set real credentials; internal placeholder
              credentials: undefined,
              secrets: undefined,
              metadata: { maskedCredentials: { token: "****internal" } },
              status: "connected",
              config: defaultConfig,
              ownerId: "system", // System-owned connection
              createdAt: now,
              updatedAt: now,
            });

            connectionsCreated++;
            console.log(`Created default connection for ${app.name}`);
          } else {
            console.log(`Default connection already exists for ${app.name}`);
          }
        } catch (error) {
          const errorMsg = `Failed to create connection for ${app.name}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      return {
        connectionsCreated,
        errors,
      };
    } catch (error) {
      console.error("Error in createDefaultInternalConnections:", error);
      errors.push(`General error: ${error}`);
      return {
        connectionsCreated,
        errors,
      };
    }
  },
});

/** Raw get (internal) including secrets */
export const getRawById = internalQuery({
  args: { id: v.id("connections") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return (await ctx.db.get(args.id)) ?? null;
  },
});

/** Secrets access (internal only) */
export const getConnectionSecrets = internalAction({
  args: { connectionId: v.id("connections") },
  returns: v.any(), // Simplified to avoid type instantiation issues
  handler: async (ctx, args) => {
    try {
    const raw = await ctx.runQuery(
      internal.integrations.connections.internalConnections.getRawById,
      { id: args.connectionId },
    );

      if (!raw) {
        return null;
      }

    return raw.secrets ?? null;
    } catch (error) {
      // Log error for debugging but don't expose details
      console.error("Failed to get connection secrets:", error);
      return null;
    }
  },
});

/** Internal mutation to update secrets safely */
export const rotateSecrets = internalMutation({
  args: {
    connectionId: v.id("connections"),
    newCredentials: v.any(),
    expiresAt: v.optional(v.number()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const conn = await ctx.db.get(args.connectionId);
    if (!conn) throw new Error("Connection not found");

    // Derive a simple masked token from any provided credential
    const firstKey = Object.keys(args.newCredentials)[0];
    const sample = firstKey ? args.newCredentials[firstKey] : undefined;
    const masked = sample ? `****${sample.slice(-4)}` : "****";

    await ctx.db.patch(args.connectionId, {
      secrets: {
        credentials: args.newCredentials,
        expiresAt: args.expiresAt,
      },
      metadata: {
        ...(conn.metadata ?? {}),
        maskedCredentials: { token: masked },
      },
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const rotateConnectionToken = internalAction({
  args: {
    connectionId: v.id("connections"),
    newCredentials: v.any(),
    expiresAt: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      internal.integrations.connections.internalConnections.rotateSecrets,
      args,
    );
  },
});

/** Simple in-memory rate limiter (per process) */
const connectionRateLimits = new Map<
  string,
  { limit: number; window: number; usage: number[] }
>();

export const checkRateLimit = internalAction({
  args: {
    connectionId: v.id("connections"),
    limit: v.number(),
    windowMs: v.number(),
  },
  returns: v.any(),
  handler: async (_ctx, args) => {
    const key = String(args.connectionId);
    const now = Date.now();
    const entry = connectionRateLimits.get(key) ?? {
      limit: args.limit,
      window: args.windowMs,
      usage: [] as number[],
    };

    // prune old
    entry.usage = entry.usage.filter((t) => now - t < entry.window);

    const allowed = entry.usage.length < entry.limit;
    if (allowed) entry.usage.push(now);

    connectionRateLimits.set(key, entry);
    return {
      allowed,
      remaining: Math.max(entry.limit - entry.usage.length, 0),
    };
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
  returns: v.any(), // Simplified to avoid deep type instantiation issues with nested validators
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

    return existingConnection ?? null;
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
    return await ctx.runMutation(
      internal.integrations.connections.internalConnections
        .createDefaultInternalConnections,
      {},
    );
  },
});

/** Helper mutation to insert connection with pre-encrypted secrets */
export const insertConnectionWithSecrets = internalMutation({
  args: {
    appId: v.id("apps"),
    name: v.string(),
    credentials: v.string(),
    ciphertext: v.string(),
    maskedCredentials: v.any(),
    config: v.optional(v.string()),
    ownerId: v.any(),
    status: v.string(),
    createdAt: v.number(),
  },
  returns: v.id("connections"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("connections", {
      appId: args.appId,
      name: args.name,
      // Keep legacy for backward compatibility
      credentials: args.credentials,
      secrets: {
        ciphertext: args.ciphertext,
      },
      metadata: {
        maskedCredentials: args.maskedCredentials,
      },
      status: args.status,
      config: args.config,
      ownerId: args.ownerId,
      createdAt: args.createdAt,
      updatedAt: args.createdAt,
    });
  },
});

/** Helper mutation to update connection with pre-encrypted secrets */
export const updateConnectionSecrets = internalMutation({
  args: {
    connectionId: v.id("connections"),
    credentials: v.optional(v.string()),
    ciphertext: v.string(),
    maskedCredentials: v.any(),
    expiresAt: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const conn = await ctx.db.get(args.connectionId);
    if (!conn) throw new Error("Connection not found");

    await ctx.db.patch(args.connectionId, {
      // Legacy format for backward compatibility
      credentials: args.credentials,
      secrets: {
        ciphertext: args.ciphertext,
        expiresAt: args.expiresAt,
      },
      metadata: {
        ...(conn.metadata ?? {}),
        maskedCredentials: args.maskedCredentials,
      },
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
