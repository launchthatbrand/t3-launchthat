/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { query } from "../../../_generated/server";

const crmMarketingTagsQueries = components.launchthat_crm.marketingTags.queries as any;

export const listMarketingTags = query({
  args: {
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(crmMarketingTagsQueries.listMarketingTags, args);
  },
});

export const getUserMarketingTags = query({
  args: {
    organizationId: v.optional(v.string()),
    userId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(crmMarketingTagsQueries.getUserMarketingTags, args);
  },
});

export const getContactIdForUser = query({
  args: {
    organizationId: v.optional(v.string()),
    userId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(crmMarketingTagsQueries.getContactIdForUser, args);
  },
});

export const contactHasMarketingTags = query({
  args: {
    organizationId: v.optional(v.string()),
    contactId: v.string(),
    tagSlugs: v.array(v.string()),
    requireAll: v.optional(v.boolean()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(crmMarketingTagsQueries.contactHasMarketingTags, {
      ...args,
      contactId: args.contactId as any,
    });
  },
});


