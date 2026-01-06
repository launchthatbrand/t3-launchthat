/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { mutation } from "../../../_generated/server";

const crmContactsMutations = components.launchthat_crm.contacts.mutations as any;

export const createContact = mutation({
  args: {
    organizationId: v.optional(v.string()),
    postTypeSlug: v.string(),
    title: v.string(),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    slug: v.string(),
    status: v.string(),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    featuredImageUrl: v.optional(v.string()),
    authorId: v.optional(v.string()),
    userId: v.optional(v.string()),
    meta: v.optional(v.any()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(crmContactsMutations.createContact, args);
  },
});

export const updateContact = mutation({
  args: {
    organizationId: v.optional(v.string()),
    contactId: v.string(),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    slug: v.optional(v.string()),
    status: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    featuredImageUrl: v.optional(v.string()),
    authorId: v.optional(v.string()),
    userId: v.optional(v.string()),
    meta: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(crmContactsMutations.updateContact, {
      ...args,
      contactId: args.contactId as any,
    });
    return null;
  },
});

export const deleteContact = mutation({
  args: {
    organizationId: v.optional(v.string()),
    contactId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(crmContactsMutations.deleteContact, {
      ...args,
      contactId: args.contactId as any,
    });
    return null;
  },
});


