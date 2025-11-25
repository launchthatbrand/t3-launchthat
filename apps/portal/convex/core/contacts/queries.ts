import { v } from "convex/values";

import type { Doc, Id } from "../../_generated/dataModel";
import { query } from "../../_generated/server";

type ContactDoc = Doc<"contacts">;

const publicContactShape = v.object({
  _id: v.id("contacts"),
  organizationId: v.id("organizations"),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  fullName: v.optional(v.string()),
  company: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const list = query({
  args: {
    organizationId: v.id("organizations"),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(publicContactShape),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 100, 500));
    const all = (await ctx.db
      .query("contacts")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .order("desc")
      .take(limit)) as ContactDoc[];

    if (!args.search) {
      return all;
    }

    const term = args.search.toLowerCase();
    return all.filter((contact) => {
      const haystack = [
        contact.fullName,
        contact.firstName,
        contact.lastName,
        contact.email,
        contact.phone,
        contact.company,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  },
});

export const get = query({
  args: {
    contactId: v.id("contacts"),
  },
  returns: v.union(publicContactShape, v.null()),
  handler: async (ctx, args) => {
    return (await ctx.db.get(args.contactId)) as ContactDoc | null;
  },
});

export const findByEmail = query({
  args: {
    organizationId: v.id("organizations"),
    email: v.string(),
  },
  returns: v.union(publicContactShape, v.null()),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("contacts")
      .withIndex("by_org_email", (q) =>
        q.eq("organizationId", args.organizationId).eq("email", args.email),
      )
      .first();
    return (existing as ContactDoc | null) ?? null;
  },
});
