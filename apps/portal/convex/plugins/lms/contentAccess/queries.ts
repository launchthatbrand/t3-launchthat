/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
// Public wrapper queries for component-scoped LMS content access rules.
//
// Frontend code should call `api.plugins.lms.contentAccess.queries.*` rather
// than reaching into the mounted component directly.
import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { query } from "../../../_generated/server";

const lmsContentAccessQueries = components.launchthat_lms.contentAccess
  .queries as any;

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
    return await ctx.runQuery(lmsContentAccessQueries.getContentAccessRules, args);
  },
});


