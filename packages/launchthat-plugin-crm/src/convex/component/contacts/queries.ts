import { v } from "convex/values";

import { query } from "../_generated/server";

const contactValidator = v.object({
  _id: v.id("contacts"),
  _creationTime: v.number(),
  title: v.string(),
  content: v.optional(v.string()),
  excerpt: v.optional(v.string()),
  slug: v.string(),
  status: v.string(),
  category: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  featuredImageUrl: v.optional(v.string()),
  postTypeSlug: v.string(),
  organizationId: v.optional(v.string()),
  authorId: v.optional(v.string()),
  userId: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

const contactMetaValidator = v.object({
  _id: v.id("contact_meta"),
  _creationTime: v.number(),
  contactId: v.id("contacts"),
  key: v.string(),
  value: v.optional(v.union(v.string(), v.number(), v.boolean(), v.null())),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

export const getContactById = query({
  args: {
    organizationId: v.optional(v.string()),
    contactId: v.id("contacts"),
  },
  returns: v.union(v.null(), contactValidator),
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) return null;
    if (
      typeof args.organizationId === "string" &&
      contact.organizationId !== args.organizationId
    ) {
      return null;
    }
    return contact;
  },
});

export const getContactBySlug = query({
  args: {
    organizationId: v.optional(v.string()),
    slug: v.string(),
  },
  returns: v.union(v.null(), contactValidator),
  handler: async (ctx, args) => {
    const slug = args.slug.trim();
    if (!slug) return null;
    if (typeof args.organizationId === "string") {
      return (
        (await ctx.db
          .query("contacts")
          .withIndex("by_org_slug", (q) =>
            q.eq("organizationId", args.organizationId).eq("slug", slug),
          )
          .unique()) ?? null
      );
    }
    return (
      (await ctx.db
        .query("contacts")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique()) ?? null
    );
  },
});

export const listContacts = query({
  args: {
    organizationId: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(contactValidator),
  handler: async (ctx, args) => {
    const limit = typeof args.limit === "number" ? args.limit : 200;
    const status = typeof args.status === "string" ? args.status.trim() : "";

    let q =
      typeof args.organizationId === "string"
        ? ctx.db
            .query("contacts")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
        : ctx.db.query("contacts");

    if (status) {
      q = q.filter((q) => q.eq(q.field("status"), status));
    }

    return await q.take(limit);
  },
});

export const getContactIdForUser = query({
  args: {
    organizationId: v.optional(v.string()),
    userId: v.string(),
  },
  returns: v.union(v.id("contacts"), v.null()),
  handler: async (ctx, args) => {
    const userId = args.userId.trim();
    if (!userId) return null;

    const contact =
      typeof args.organizationId === "string"
        ? await ctx.db
            .query("contacts")
            .withIndex("by_org_and_userId", (q) =>
              q.eq("organizationId", args.organizationId).eq("userId", userId),
            )
            .unique()
        : await ctx.db
            .query("contacts")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .unique();

    return contact?._id ?? null;
  },
});

export const getContactMeta = query({
  args: {
    contactId: v.id("contacts"),
  },
  returns: v.array(contactMetaValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contact_meta")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .collect();
  },
});


