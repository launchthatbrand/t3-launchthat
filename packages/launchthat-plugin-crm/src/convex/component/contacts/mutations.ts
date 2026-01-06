import { v } from "convex/values";

import { mutation } from "../_generated/server";

const normalizeMetaValue = (value: unknown): string | number | boolean | null => {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value;
  }
  return JSON.stringify(value);
};

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
  returns: v.id("contacts"),
  handler: async (ctx, args) => {
    const now = Date.now();

    const id = await ctx.db.insert("contacts", {
      organizationId: args.organizationId,
      postTypeSlug: args.postTypeSlug,
      title: args.title,
      content: args.content,
      excerpt: args.excerpt,
      slug: args.slug,
      status: args.status,
      category: args.category,
      tags: args.tags,
      featuredImageUrl: args.featuredImageUrl,
      authorId: args.authorId,
      userId: args.userId,
      createdAt: now,
      updatedAt: now,
    });

    const metaObj =
      args.meta && typeof args.meta === "object" ? (args.meta as Record<string, unknown>) : null;
    if (metaObj) {
      for (const [key, raw] of Object.entries(metaObj)) {
        if (!key) continue;
        const value = normalizeMetaValue(raw);
        const existing = await ctx.db
          .query("contact_meta")
          .withIndex("by_contact_and_key", (q) => q.eq("contactId", id).eq("key", key))
          .unique();
        if (existing) {
          await ctx.db.patch(existing._id, { value, updatedAt: now });
        } else {
          await ctx.db.insert("contact_meta", {
            contactId: id,
            key,
            value,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    return id;
  },
});

export const updateContact = mutation({
  args: {
    organizationId: v.optional(v.string()),
    contactId: v.id("contacts"),
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
    const now = Date.now();
    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw new Error("Contact not found");
    if (
      typeof args.organizationId === "string" &&
      contact.organizationId !== args.organizationId
    ) {
      throw new Error("Contact not found");
    }

    const { contactId, meta, ...updates } = args;
    await ctx.db.patch(args.contactId, {
      ...updates,
      updatedAt: now,
    });

    const metaObj =
      meta && typeof meta === "object" ? (meta as Record<string, unknown>) : null;
    if (metaObj) {
      for (const [key, raw] of Object.entries(metaObj)) {
        if (!key) continue;
        const value = normalizeMetaValue(raw);
        const existing = await ctx.db
          .query("contact_meta")
          .withIndex("by_contact_and_key", (q) =>
            q.eq("contactId", args.contactId).eq("key", key),
          )
          .unique();
        if (existing) {
          await ctx.db.patch(existing._id, { value, updatedAt: now });
        } else {
          await ctx.db.insert("contact_meta", {
            contactId: args.contactId,
            key,
            value,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    return null;
  },
});

export const deleteContact = mutation({
  args: {
    organizationId: v.optional(v.string()),
    contactId: v.id("contacts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) return null;
    if (
      typeof args.organizationId === "string" &&
      contact.organizationId !== args.organizationId
    ) {
      return null;
    }

    const metaRows = await ctx.db
      .query("contact_meta")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .collect();
    for (const row of metaRows) {
      await ctx.db.delete(row._id);
    }

    const tagRows = await ctx.db
      .query("contactMarketingTags")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .collect();
    for (const row of tagRows) {
      await ctx.db.delete(row._id);
    }

    await ctx.db.delete(args.contactId);
    return null;
  },
});


