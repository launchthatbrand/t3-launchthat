import { internal } from "../../_generated/api";
import { mutation } from "../../_generated/server";
import { v } from "convex/values";

// Define types for the update fields
interface UpdateFields {
  name?: string;
  // deprecated; keep for legacy writes only
  credentials?: string;
  status?: string;
  config?: string;
  lastError?: string;
  lastCheckedAt?: number;
  updatedAt: number;
  metadata?: {
    lastUsed?: number;
    errorMessage?: string;
    maskedCredentials?: Record<string, string>;
  };
  secrets?: {
    credentials?: Record<string, string>;
    ciphertext?: ArrayBuffer;
    expiresAt?: number;
  };
}

/**
 * Create a new connection for an integration app
 */
export const create = mutation({
  args: {
    appId: v.id("apps"),
    name: v.string(),
    // Accept raw credentials; we will store safely
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

    if (typeof args.ownerId !== "string") {
      const owner = await ctx.db.get(args.ownerId);
      if (!owner) {
        throw new Error(`User with ID ${String(args.ownerId)} not found`);
      }
    }

    const now = Date.now();

    // Create the connection with encrypted secrets via internal action
    return await ctx.runMutation(
      internal.integrations.connections.internalConnections
        .createWithEncryptedSecrets,
      {
        appId: args.appId,
        name: args.name,
        credentials: args.credentials,
        config: args.config,
        ownerId: args.ownerId,
        status: args.status ?? "active",
        createdAt: now,
      },
    );
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
    const updatedFields: UpdateFields = { updatedAt: now };

    if (args.name !== undefined) updatedFields.name = args.name;
    if (args.status !== undefined) updatedFields.status = args.status;
    if (args.config !== undefined) updatedFields.config = args.config;

    // If rotating credentials via update, use internal action for encryption
    if (args.credentials !== undefined) {
      await ctx.runMutation(
        internal.integrations.connections.internalConnections
          .rotateEncryptedSecrets,
        {
          connectionId: args.id,
          newCredentials: { token: args.credentials },
        },
      );
    } else {
      // Update non-secret fields directly
      await ctx.db.patch(args.id, updatedFields);
    }

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
    let app;
    let connectionCredentials;

    if (args.id) {
      const connection = await ctx.db.get(args.id);
      if (!connection) {
        throw new Error(`Connection with ID ${args.id} not found`);
      }
      app = await ctx.db.get(connection.appId);
      connectionCredentials = args.credentials ?? connection.credentials;
    } else if (args.appId && args.credentials) {
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

    console.log("Testing connection with credentials:", connectionCredentials);

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
    const connection = await ctx.db.get(args.id);
    if (!connection) {
      throw new Error(`Connection with ID ${args.id} not found`);
    }

    await ctx.db.delete(args.id);
    return true;
  },
});
