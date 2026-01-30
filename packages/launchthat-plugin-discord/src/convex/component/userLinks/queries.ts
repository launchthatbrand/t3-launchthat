import { v } from "convex/values";
import { query } from "../server";

export const getUserLink = query({
  args: { organizationId: v.string(), userId: v.string() },
  returns: v.union(
    v.object({
      discordUserId: v.string(),
      linkedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("userLinks")
      .withIndex("by_organizationId_and_userId", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();
    if (!link) return null;
    return { discordUserId: link.discordUserId, linkedAt: link.linkedAt };
  },
});

export const getUserLinkForUser = query({
  args: { userId: v.string() },
  returns: v.union(
    v.object({
      discordUserId: v.string(),
      linkedAt: v.number(),
      organizationId: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("userLinks")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .unique();
    if (!link) return null;
    return {
      discordUserId: link.discordUserId,
      linkedAt: link.linkedAt,
      organizationId: link.organizationId,
    };
  },
});
export const getUserIdByDiscordUserId = query({
  args: { organizationId: v.string(), discordUserId: v.string() },
  returns: v.union(
    v.object({
      userId: v.string(),
      linkedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("userLinks")
      .withIndex("by_organizationId_and_discordUserId", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("discordUserId", args.discordUserId),
      )
      .unique();
    if (!link) return null;
    return { userId: link.userId, linkedAt: link.linkedAt };
  },
});



