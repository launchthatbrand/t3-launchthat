import { v } from "convex/values";
import { mutation } from "../server";

export const createConnectDraft = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    environment: v.union(v.literal("demo"), v.literal("live")),
    server: v.string(),
    accessTokenEncrypted: v.string(),
    refreshTokenEncrypted: v.string(),
    accessTokenExpiresAt: v.optional(v.number()),
    refreshTokenExpiresAt: v.optional(v.number()),
    expiresAt: v.number(),
  },
  returns: v.id("tradelockerConnectDrafts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("tradelockerConnectDrafts", {
      organizationId: args.organizationId,
      userId: args.userId,
      environment: args.environment,
      server: args.server,
      accessTokenEncrypted: args.accessTokenEncrypted,
      refreshTokenEncrypted: args.refreshTokenEncrypted,
      accessTokenExpiresAt: args.accessTokenExpiresAt,
      refreshTokenExpiresAt: args.refreshTokenExpiresAt,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    });
  },
});

export const consumeConnectDraft = mutation({
  args: {
    draftId: v.id("tradelockerConnectDrafts"),
    organizationId: v.string(),
    userId: v.string(),
  },
  returns: v.union(
    v.object({
      environment: v.union(v.literal("demo"), v.literal("live")),
      server: v.string(),
      accessTokenEncrypted: v.string(),
      refreshTokenEncrypted: v.string(),
      accessTokenExpiresAt: v.optional(v.number()),
      refreshTokenExpiresAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);
    if (!draft) return null;
    if (
      draft.organizationId !== args.organizationId ||
      draft.userId !== args.userId
    ) {
      return null;
    }
    if (Date.now() > draft.expiresAt) {
      await ctx.db.delete(draft._id);
      return null;
    }
    await ctx.db.delete(draft._id);
    return {
      environment: draft.environment,
      server: draft.server,
      accessTokenEncrypted: draft.accessTokenEncrypted,
      refreshTokenEncrypted: draft.refreshTokenEncrypted,
      accessTokenExpiresAt: draft.accessTokenExpiresAt,
      refreshTokenExpiresAt: draft.refreshTokenExpiresAt,
    };
  },
});


