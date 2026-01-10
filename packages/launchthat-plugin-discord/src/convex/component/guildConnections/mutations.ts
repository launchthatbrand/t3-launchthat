import { v } from "convex/values";

import { mutation } from "../server";

export const upsertGuildConnection = mutation({
  args: {
    organizationId: v.string(),
    guildId: v.string(),
    guildName: v.optional(v.string()),
    botModeAtConnect: v.union(v.literal("global"), v.literal("custom")),
    connectedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("guildConnections")
      .withIndex("by_organizationId_and_guildId", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("guildId", args.guildId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        guildName: args.guildName,
        botModeAtConnect: args.botModeAtConnect,
        connectedAt: args.connectedAt,
      });
      return null;
    }

    await ctx.db.insert("guildConnections", {
      organizationId: args.organizationId,
      guildId: args.guildId,
      guildName: args.guildName,
      botModeAtConnect: args.botModeAtConnect,
      connectedAt: args.connectedAt,
    });
    return null;
  },
});

export const deleteGuildConnection = mutation({
  args: { organizationId: v.string(), guildId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("guildConnections")
      .withIndex("by_organizationId_and_guildId", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("guildId", args.guildId),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});


