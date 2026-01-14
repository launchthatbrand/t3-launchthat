import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const upsertProfile = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    isPublic: v.boolean(),
  },
  returns: v.object({
    _id: v.id("journalProfiles"),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("journalProfiles")
      .withIndex("by_org_and_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isPublic: args.isPublic,
        updatedAt: now,
      });
      return { _id: existing._id };
    }

    const _id = await ctx.db.insert("journalProfiles", {
      organizationId: args.organizationId,
      userId: args.userId,
      isPublic: args.isPublic,
      createdAt: now,
      updatedAt: now,
    });
    return { _id };
  },
});


