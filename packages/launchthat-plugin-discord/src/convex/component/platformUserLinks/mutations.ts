import { v } from "convex/values";
import { mutation } from "../server";

export const linkUser = mutation({
  args: {
    userId: v.string(),
    discordUserId: v.string(),
    discordUsername: v.optional(v.string()),
    discordDiscriminator: v.optional(v.string()),
    discordGlobalName: v.optional(v.string()),
    discordAvatar: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("platformUserLinks")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        discordUserId: args.discordUserId,
        discordUsername: args.discordUsername,
        discordDiscriminator: args.discordDiscriminator,
        discordGlobalName: args.discordGlobalName,
        discordAvatar: args.discordAvatar,
        linkedAt: Date.now(),
      });
      return null;
    }

    await ctx.db.insert("platformUserLinks", {
      userId: args.userId,
      discordUserId: args.discordUserId,
      discordUsername: args.discordUsername,
      discordDiscriminator: args.discordDiscriminator,
      discordGlobalName: args.discordGlobalName,
      discordAvatar: args.discordAvatar,
      linkedAt: Date.now(),
    });
    return null;
  },
});

export const unlinkUser = mutation({
  args: {
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("platformUserLinks")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});
