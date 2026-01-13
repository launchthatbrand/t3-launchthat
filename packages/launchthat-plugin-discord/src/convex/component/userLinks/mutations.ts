import { v } from "convex/values";
import { mutation } from "../server";

export const linkUser = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    discordUserId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userLinks")
      .withIndex("by_organizationId_and_userId", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        discordUserId: args.discordUserId,
        linkedAt: Date.now(),
      });
      return null;
    }

    await ctx.db.insert("userLinks", {
      organizationId: args.organizationId,
      userId: args.userId,
      discordUserId: args.discordUserId,
      linkedAt: Date.now(),
    });
    return null;
  },
});

export const unlinkUser = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userLinks")
      .withIndex("by_organizationId_and_userId", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});



