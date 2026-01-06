/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { query } from "../../../_generated/server";

const crmContactsQueries = components.launchthat_crm.contacts.queries as any;

export const getContactById = query({
  args: {
    organizationId: v.optional(v.string()),
    contactId: v.string(),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    return await ctx.runQuery(crmContactsQueries.getContactById, {
      ...args,
      contactId: args.contactId as any,
    });
  },
});

export const getContactIdForUser = query({
  args: {
    organizationId: v.optional(v.string()),
    userId: v.string(),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    return await ctx.runQuery(crmContactsQueries.getContactIdForUser, args);
  },
});

export const listContacts = query({
  args: {
    organizationId: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(crmContactsQueries.listContacts, args);
  },
});

export const getContactMeta = query({
  args: {
    contactId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(crmContactsQueries.getContactMeta, {
      ...args,
      contactId: args.contactId as any,
    });
  },
});


