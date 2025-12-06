"use node";

import { action } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { v } from "convex/values";

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

      return existing._id;
    }

    return await ctx.runAction(
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
  },
});
