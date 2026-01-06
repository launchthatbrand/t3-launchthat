import { v } from "convex/values";

import { mutation } from "../_generated/server";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const createMarketingTag = mutation({
  args: {
    organizationId: v.optional(v.string()),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    color: v.optional(v.string()),
    slug: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    createdBy: v.optional(v.string()),
  },
  returns: v.id("marketingTags"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const slug = args.slug
      ? slugify(args.slug)
      : slugify(args.name) || `tag-${now}`;

    const existing =
      typeof args.organizationId === "string"
        ? await ctx.db
            .query("marketingTags")
            .withIndex("by_org_and_slug", (q) =>
              q.eq("organizationId", args.organizationId).eq("slug", slug),
            )
            .first()
        : await ctx.db
            .query("marketingTags")
            .withIndex("by_slug", (q) => q.eq("slug", slug))
            .first();
    if (existing) {
      throw new Error("A tag with this slug already exists");
    }

    return await ctx.db.insert("marketingTags", {
      organizationId: args.organizationId,
      name: args.name,
      description: args.description,
      category: args.category,
      color: args.color,
      slug,
      isActive: args.isActive ?? true,
      createdAt: now,
      createdBy: args.createdBy,
    });
  },
});

export const assignMarketingTagToUser = mutation({
  args: {
    organizationId: v.optional(v.string()),
    contactId: v.id("contacts"),
    marketingTagId: v.id("marketingTags"),
    source: v.optional(v.string()),
    assignedBy: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  returns: v.id("contactMarketingTags"),
  handler: async (ctx, args) => {
    const existingByOrg =
      typeof args.organizationId === "string"
        ? await ctx.db
            .query("contactMarketingTags")
            .withIndex("by_org_and_contact_tag", (q) =>
              q
                .eq("organizationId", args.organizationId)
                .eq("contactId", args.contactId)
                .eq("marketingTagId", args.marketingTagId),
            )
            .first()
        : null;

    const existingByContact = await ctx.db
      .query("contactMarketingTags")
      .withIndex("by_contact_tag", (q) =>
        q.eq("contactId", args.contactId).eq("marketingTagId", args.marketingTagId),
      )
      .first();

    const existing =
      existingByOrg ??
      (typeof args.organizationId === "string"
        ? existingByContact &&
          (existingByContact.organizationId === undefined ||
            existingByContact.organizationId === args.organizationId)
          ? existingByContact
          : null
        : existingByContact);

    const payload = {
      organizationId: args.organizationId,
      contactId: args.contactId,
      marketingTagId: args.marketingTagId,
      source: args.source ?? "admin_manual",
      assignedBy: args.assignedBy,
      assignedAt: Date.now(),
      expiresAt: args.expiresAt,
      notes: args.notes,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return await ctx.db.insert("contactMarketingTags", payload);
  },
});

export const removeMarketingTagFromUser = mutation({
  args: {
    organizationId: v.optional(v.string()),
    contactId: v.id("contacts"),
    marketingTagId: v.id("marketingTags"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existingByOrg =
      typeof args.organizationId === "string"
        ? await ctx.db
            .query("contactMarketingTags")
            .withIndex("by_org_and_contact_tag", (q) =>
              q
                .eq("organizationId", args.organizationId)
                .eq("contactId", args.contactId)
                .eq("marketingTagId", args.marketingTagId),
            )
            .first()
        : null;

    const existingByContact = await ctx.db
      .query("contactMarketingTags")
      .withIndex("by_contact_tag", (q) =>
        q.eq("contactId", args.contactId).eq("marketingTagId", args.marketingTagId),
      )
      .first();

    const existing =
      existingByOrg ??
      (typeof args.organizationId === "string"
        ? existingByContact &&
          (existingByContact.organizationId === undefined ||
            existingByContact.organizationId === args.organizationId)
          ? existingByContact
          : null
        : existingByContact);

    if (!existing) return false;
    await ctx.db.delete(existing._id);
    return true;
  },
});


