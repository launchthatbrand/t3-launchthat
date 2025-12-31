/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
// Public wrapper mutations for component-scoped LMS content access rules.
import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { mutation } from "../../../_generated/server";

const lmsContentAccessMutations = components.launchthat_lms.contentAccess
  .mutations as any;

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
    return await ctx.runMutation(
      lmsContentAccessMutations.saveContentAccessRules,
      args,
    );
  },
});

export const clearContentAccessRules = mutation({
  args: {
    contentType: contentTypeValidator,
    contentId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      lmsContentAccessMutations.clearContentAccessRules,
      args,
    );
  },
});


