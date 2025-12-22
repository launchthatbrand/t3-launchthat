import { v } from "convex/values";

import { components } from "../../_generated/api";
import { query } from "../../_generated/server";

const lmsContentAccessQueries = components.launchthat_lms.contentAccess.queries;

const contentTypeValidator = v.union(
  v.literal("course"),
  v.literal("lesson"),
  v.literal("topic"),
  v.literal("download"),
  v.literal("product"),
  v.literal("quiz"),
);

export const getContentAccessRules = query({
  args: {
    contentType: contentTypeValidator,
    contentId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(lmsContentAccessQueries.getContentAccessRules, args);
  },
});


