import { ConvexError, v } from "convex/values";

import { mutation } from "../_generated/server";

const contentTypeValidator = v.union(
  v.literal("course"),
  v.literal("lesson"),
  v.literal("topic"),
  v.literal("download"),
  v.literal("product"),
  v.literal("quiz"),
);

const tagRuleValidator = v.object({
  mode: v.union(v.literal("all"), v.literal("some")),
  tagIds: v.array(v.string()),
});

export const saveContentAccessRules = mutation({
  args: {
    contentType: contentTypeValidator,
    contentId: v.string(),
    isPublic: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    priority: v.optional(v.number()),
    requiredTags: tagRuleValidator,
    excludedTags: tagRuleValidator,
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const now = Date.now();

    const existing = await ctx.db
      .query("contentAccessRules")
      .withIndex("by_content", (q) =>
        q.eq("contentType", args.contentType).eq("contentId", args.contentId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isPublic: args.isPublic,
        isActive: args.isActive ?? true,
        priority: args.priority ?? 1,
        requiredTags: args.requiredTags,
        excludedTags: args.excludedTags,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("contentAccessRules", {
      contentType: args.contentType,
      contentId: args.contentId,
      isPublic: args.isPublic,
      isActive: args.isActive ?? true,
      priority: args.priority ?? 1,
      requiredTags: args.requiredTags,
      excludedTags: args.excludedTags,
      createdAt: now,
      updatedAt: now,
      createdBy: identity.tokenIdentifier,
    });
  },
});

export const clearContentAccessRules = mutation({
  args: {
    contentType: contentTypeValidator,
    contentId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("contentAccessRules")
      .withIndex("by_content", (q) =>
        q.eq("contentType", args.contentType).eq("contentId", args.contentId),
      )
      .unique();

    if (!existing) {
      return false;
    }

    await ctx.db.delete(existing._id);
    return true;
  },
});


