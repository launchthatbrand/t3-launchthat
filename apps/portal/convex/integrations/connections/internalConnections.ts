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
 * Create default connections for internal node types
 * This is called when node types are seeded to ensure internal nodes have their default connections
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
      // Define internal node types that should have default connections
      const internalNodeTypes = ["webhook", "orders", "passthrough"];

      console.log(`Processing ${internalNodeTypes.length} internal node types`);

      // Get all existing connections to avoid duplicates
      const existingConnections = await ctx.db.query("connections").collect();
      const existingConnectionsByNodeType = new Map<
        string,
        Doc<"connections">[]
      >();

      for (const conn of existingConnections) {
        const list = existingConnectionsByNodeType.get(conn.nodeType) ?? [];
        list.push(conn);
        existingConnectionsByNodeType.set(conn.nodeType, list);
      }

      const now = Date.now();

      for (const nodeType of internalNodeTypes) {
        try {
          // Check if this internal node type already has a default connection
          const existingNodeTypeConnections =
            existingConnectionsByNodeType.get(nodeType) ?? [];
          const hasDefaultConnection = existingNodeTypeConnections.some(
            (conn) =>
              conn.name === `${nodeType} (Default)` || conn.name === nodeType,
          );

          if (!hasDefaultConnection) {
            // Create a default connection for this internal node type
            const connectionName = `${nodeType} (Default)`;

            const defaultConfig = JSON.stringify({
              enabled: true,
              isDefault: true,
              createdBy: "system",
            });

            await ctx.db.insert("connections", {
              nodeType: nodeType,
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
            console.log(`Created default connection for ${nodeType}`);
          } else {
            console.log(`Default connection already exists for ${nodeType}`);
          }
        } catch (error) {
          const errorMsg = `Failed to create connection for ${nodeType}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      return {
        connectionsCreated,
        errors,
      };
    } catch (error) {
      console.error("Failed to create default internal connections:", error);
      return {
        connectionsCreated: 0,
        errors: [String(error)],
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
 * Get existing default connection for an internal node type
 * This only reads, doesn't create - use createDefaultInternalConnections for creation
 */
export const getInternalConnection = internalQuery({
  args: {
    nodeType: v.string(),
  },
  returns: v.any(), // Simplified to avoid deep type instantiation issues with nested validators
  handler: async (ctx, args) => {
    // Check if the node type is internal
    const internalNodeTypes = ["webhook", "orders", "passthrough"];
    if (!internalNodeTypes.includes(args.nodeType)) {
      return null;
    }

    // Look for existing default connection
    const existingConnection = await ctx.db
      .query("connections")
      .withIndex("by_node_type", (q) => q.eq("nodeType", args.nodeType))
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
    nodeType: v.string(),
    name: v.string(),
    credentials: v.string(),
    ciphertext: v.bytes(),
    maskedCredentials: v.any(),
    config: v.optional(v.string()),
    ownerId: v.any(),
    status: v.string(),
    createdAt: v.number(),
  },
  returns: v.id("connections"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("connections", {
      nodeType: args.nodeType,
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
    ciphertext: v.bytes(),
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

export const updateConnectionMetadata = internalMutation({
  args: {
    id: v.id("connections"),
    name: v.optional(v.string()),
    status: v.optional(v.string()),
    config: v.optional(v.string()),
    lastUsed: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Connection not found");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.status !== undefined) updates.status = args.status;
    if (args.config !== undefined) updates.config = args.config;

    if (args.lastUsed !== undefined) {
      updates.metadata = {
        ...(existing.metadata ?? {}),
        lastUsed: args.lastUsed,
      };
    }

    await ctx.db.patch(args.id, updates);
    return null;
  },
});

export const deleteConnectionById = internalMutation({
  args: { id: v.id("connections") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});
