"use node";

import { v } from "convex/values";

import { internal } from "../../_generated/api";
import { action } from "../../_generated/server";

export const create = action({
  args: {
    nodeType: v.string(),
    name: v.string(),
    credentials: v.string(),
    ownerId: v.union(v.id("users"), v.string()),
    config: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  returns: v.id("connections"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.runAction(
      internal.integrations.connections.cryptoActions
        .createWithEncryptedSecrets,
      {
        nodeType: args.nodeType,
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

export const update = action({
  args: {
    id: v.id("connections"),
    name: v.optional(v.string()),
    credentials: v.optional(v.string()),
    status: v.optional(v.string()),
    config: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const connection = await ctx.runQuery(
      internal.integrations.connections.queries.get,
      { id: args.id },
    );
    if (!connection) {
      throw new Error("Connection not found");
    }

    if (args.credentials !== undefined) {
      await ctx.runAction(
        internal.integrations.connections.cryptoActions.rotateEncryptedSecrets,
        {
          connectionId: args.id,
          newCredentials: { token: args.credentials },
        },
      );
    }

    if (
      args.name !== undefined ||
      args.status !== undefined ||
      args.config !== undefined
    ) {
      await ctx.runMutation(
        internal.integrations.connections.internalConnections
          .updateConnectionMetadata,
        {
          id: args.id,
          name: args.name,
          status: args.status,
          config: args.config,
        },
      );
    }

    return true;
  },
});

export const upsertForOwner = action({
  args: {
    nodeType: v.string(),
    name: v.string(),
    credentials: v.string(),
    ownerId: v.union(v.id("users"), v.string()),
    config: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  returns: v.id("connections"),
  handler: async (ctx, args) => {
    const existing = await ctx.runQuery(
      internal.integrations.connections.queries.getConnectionByNodeTypeAndOwner,
      {
        nodeType: args.nodeType,
        ownerId: args.ownerId,
      },
    );

    const now = Date.now();
    if (existing) {
      await ctx.runAction(
        internal.integrations.connections.cryptoActions.rotateEncryptedSecrets,
        {
          connectionId: existing._id,
          newCredentials: { token: args.credentials },
        },
      );

      await ctx.runMutation(
        internal.integrations.connections.internalConnections
          .updateConnectionMetadata,
        {
          id: existing._id,
          name: args.name,
          status: args.status ?? "connected",
          config: args.config,
          lastUsed: now,
        },
      );

      if (
        args.nodeType === "vimeo" &&
        (args.status ?? "connected") === "connected"
      ) {
        try {
          await ctx.runAction(
            internal.plugins.vimeo.actions.ensureWebhookSubscription,
            {
              connectionId: existing._id,
            },
          );
        } catch (error) {
          console.error("Failed to ensure Vimeo webhook subscription:", error);
        }
      }

      return existing._id;
    }

    const connectionId = await ctx.runAction(
      internal.integrations.connections.cryptoActions
        .createWithEncryptedSecrets,
      {
        nodeType: args.nodeType,
        name: args.name,
        credentials: args.credentials,
        config: args.config,
        ownerId: args.ownerId,
        status: args.status ?? "connected",
        createdAt: now,
      },
    );

    if (
      args.nodeType === "vimeo" &&
      (args.status ?? "connected") === "connected"
    ) {
      try {
        await ctx.runAction(internal.plugins.vimeo.actions.ensureWebhookSubscription, {
          connectionId,
        });
      } catch (error) {
        console.error("Failed to ensure Vimeo webhook subscription:", error);
      }
    }

    return connectionId;
  },
});

export const remove = action({
  args: { id: v.id("connections") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const connection = await ctx.runQuery(
      internal.integrations.connections.queries.get,
      { id: args.id },
    );

    if (!connection) {
      throw new Error("Connection not found");
    }

    if (connection.nodeType === "vimeo") {
      try {
        await ctx.runAction(internal.plugins.vimeo.actions.removeWebhookSubscription, {
          connectionId: args.id,
        });
      } catch (error) {
        console.error("Failed to remove Vimeo webhook subscription:", error);
      }

      // IMPORTANT: wipe per-connection Vimeo library rows so reconnecting doesn’t duplicate videos.
      try {
        await ctx.runMutation(
          internal.plugins.vimeo.internalMutations.deleteVimeoDataForConnection,
          {
            connectionId: args.id,
          },
        );
      } catch (error) {
        console.error("Failed to delete Vimeo connection data:", error);
      }
    }

    await ctx.runMutation(
      internal.integrations.connections.internalConnections
        .deleteConnectionById,
      { id: args.id },
    );

    return true;
  },
});
