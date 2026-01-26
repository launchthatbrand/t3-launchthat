import { v } from "convex/values";

import { query } from "./_generated/server";

export const getCrmDashboardMetrics = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.object({
    contacts: v.object({
      total: v.number(),
      isTruncated: v.boolean(),
    }),
    tags: v.object({
      total: v.number(),
      isTruncated: v.boolean(),
    }),
    tagAssignments: v.object({
      total: v.number(),
      isTruncated: v.boolean(),
    }),
  }),
  handler: async (ctx, args) => {
    const limitRaw = typeof args.limit === "number" ? args.limit : 5000;
    const limit = Math.max(100, Math.min(20000, Math.floor(limitRaw)));

    const contacts = await ctx.db.query("contacts").take(limit);
    const tags = await ctx.db.query("marketingTags").take(limit);
    const tagAssignments = await ctx.db
      .query("contactMarketingTags")
      .take(limit);

    return {
      contacts: {
        total: contacts.length,
        isTruncated: contacts.length >= limit,
      },
      tags: {
        total: tags.length,
        isTruncated: tags.length >= limit,
      },
      tagAssignments: {
        total: tagAssignments.length,
        isTruncated: tagAssignments.length >= limit,
      },
    };
  },
});
