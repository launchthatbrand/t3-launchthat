import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { mutation } from "../../../_generated/server";
import { requireAdmin } from "../../../lib/permissions/requirePermission";

const crmMarketingTagsMutations = components.launchthat_crm.marketingTags.mutations as any;
const crmMarketingTagsQueries = components.launchthat_crm.marketingTags.queries as any;

export const createMarketingTag = mutation({
  args: {
    organizationId: v.optional(v.string()),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    color: v.optional(v.string()),
    slug: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const identity = await ctx.auth.getUserIdentity();
    const createdBy = identity?.tokenIdentifier ?? undefined;
    return await ctx.runMutation(crmMarketingTagsMutations.createMarketingTag, {
      ...args,
      createdBy,
    });
  },
});

export const assignMarketingTagToUser = mutation({
  args: {
    organizationId: v.optional(v.string()),
    userId: v.string(),
    marketingTagId: v.any(),
    source: v.optional(v.string()),
    assignedBy: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const identity = await ctx.auth.getUserIdentity();
    const assignedBy = args.assignedBy ?? identity?.tokenIdentifier ?? undefined;
    const contactId = (await ctx.runQuery(crmMarketingTagsQueries.getContactIdForUser, {
      organizationId: args.organizationId,
      userId: args.userId,
    })) as string | null;
    if (!contactId) {
      throw new Error("No CRM contact linked to this user");
    }
    return await ctx.runMutation(crmMarketingTagsMutations.assignMarketingTagToUser, {
      organizationId: args.organizationId,
      contactId,
      marketingTagId: args.marketingTagId,
      source: args.source,
      assignedBy,
      expiresAt: args.expiresAt,
      notes: args.notes,
    });
  },
});

export const removeMarketingTagFromUser = mutation({
  args: {
    organizationId: v.optional(v.string()),
    userId: v.string(),
    marketingTagId: v.any(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const contactId = (await ctx.runQuery(crmMarketingTagsQueries.getContactIdForUser, {
      organizationId: args.organizationId,
      userId: args.userId,
    })) as string | null;
    if (!contactId) {
      throw new Error("No CRM contact linked to this user");
    }
    return await ctx.runMutation(crmMarketingTagsMutations.removeMarketingTagFromUser, {
      organizationId: args.organizationId,
      contactId,
      marketingTagId: args.marketingTagId,
    });
  },
});

export const assignMarketingTagToContact = mutation({
  args: {
    organizationId: v.optional(v.string()),
    contactId: v.string(),
    marketingTagId: v.any(),
    source: v.optional(v.string()),
    assignedBy: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const identity = await ctx.auth.getUserIdentity();
    const assignedBy = args.assignedBy ?? identity?.tokenIdentifier ?? undefined;
    return await ctx.runMutation(crmMarketingTagsMutations.assignMarketingTagToUser, {
      organizationId: args.organizationId,
      contactId: args.contactId as any,
      marketingTagId: args.marketingTagId,
      source: args.source,
      assignedBy,
      expiresAt: args.expiresAt,
      notes: args.notes,
    });
  },
});

export const removeMarketingTagFromContact = mutation({
  args: {
    organizationId: v.optional(v.string()),
    contactId: v.string(),
    marketingTagId: v.any(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.runMutation(crmMarketingTagsMutations.removeMarketingTagFromUser, {
      organizationId: args.organizationId,
      contactId: args.contactId as any,
      marketingTagId: args.marketingTagId,
    });
  },
});


