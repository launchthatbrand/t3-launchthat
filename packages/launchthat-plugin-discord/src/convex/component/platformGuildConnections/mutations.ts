import { v } from "convex/values";
import { mutation } from "../server";

export const upsertGuildConnection = mutation({
  args: {
    guildId: v.string(),
    guildName: v.optional(v.string()),
    botModeAtConnect: v.union(v.literal("global"), v.literal("custom")),
    connectedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("platformGuildConnections")
      .withIndex("by_guildId", (q: any) => q.eq("guildId", args.guildId))
      .unique();

    const patch = {
      guildId: args.guildId,
      guildName: args.guildName,
      botModeAtConnect: args.botModeAtConnect,
      connectedAt: args.connectedAt,
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return null;
    }

    await ctx.db.insert("platformGuildConnections", patch);
    return null;
  },
});

export const deleteGuildConnection = mutation({
  args: { guildId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("platformGuildConnections")
      .withIndex("by_guildId", (q: any) => q.eq("guildId", args.guildId))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});
