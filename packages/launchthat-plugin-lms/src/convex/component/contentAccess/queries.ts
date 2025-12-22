import { v } from "convex/values";

import { query } from "../_generated/server";

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

const contentAccessRuleValidator = v.object({
  contentType: contentTypeValidator,
  contentId: v.string(),
  isPublic: v.optional(v.boolean()),
  isActive: v.optional(v.boolean()),
  priority: v.optional(v.number()),
  requiredTags: tagRuleValidator,
  excludedTags: tagRuleValidator,
});

export const getContentAccessRules = query({
  args: {
    contentType: contentTypeValidator,
    contentId: v.string(),
  },
  returns: v.union(contentAccessRuleValidator, v.null()),
  handler: async (ctx, args) => {
    const rule = await ctx.db
      .query("contentAccessRules")
      .withIndex("by_content", (q) =>
        q.eq("contentType", args.contentType).eq("contentId", args.contentId),
      )
      .unique();

    if (!rule) {
      return null;
    }

    return {
      contentType: rule.contentType,
      contentId: rule.contentId,
      isPublic: rule.isPublic ?? undefined,
      isActive: rule.isActive ?? undefined,
      priority: rule.priority ?? undefined,
      requiredTags: rule.requiredTags,
      excludedTags: rule.excludedTags,
    };
  },
});
