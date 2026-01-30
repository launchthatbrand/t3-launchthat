import { v } from "convex/values";
import { query } from "../server";

export const getUserLink = query({
  args: { userId: v.string() },
  returns: v.union(
    v.object({
      discordUserId: v.string(),
      linkedAt: v.number(),
      discordUsername: v.optional(v.string()),
      discordDiscriminator: v.optional(v.string()),
      discordGlobalName: v.optional(v.string()),
      discordAvatar: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("platformUserLinks")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .unique();
    if (!link) return null;
    return {
      discordUserId: link.discordUserId,
      linkedAt: link.linkedAt,
      discordUsername: link.discordUsername,
      discordDiscriminator: link.discordDiscriminator,
      discordGlobalName: link.discordGlobalName,
      discordAvatar: link.discordAvatar,
    };
  },
});

export const getUserIdByDiscordUserId = query({
  args: { discordUserId: v.string() },
  returns: v.union(
    v.object({
      userId: v.string(),
      linkedAt: v.number(),
      discordUsername: v.optional(v.string()),
      discordDiscriminator: v.optional(v.string()),
      discordGlobalName: v.optional(v.string()),
      discordAvatar: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("platformUserLinks")
      .withIndex("by_discordUserId", (q: any) =>
        q.eq("discordUserId", args.discordUserId),
      )
      .unique();
    if (!link) return null;
    return {
      userId: link.userId,
      linkedAt: link.linkedAt,
      discordUsername: link.discordUsername,
      discordDiscriminator: link.discordDiscriminator,
      discordGlobalName: link.discordGlobalName,
      discordAvatar: link.discordAvatar,
    };
  },
});
