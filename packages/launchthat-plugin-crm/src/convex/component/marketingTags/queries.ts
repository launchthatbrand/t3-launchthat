import { v } from "convex/values";

import { query } from "../_generated/server";

const marketingTagValidator = v.object({
  _id: v.id("marketingTags"),
  _creationTime: v.number(),
  organizationId: v.optional(v.string()),
  name: v.string(),
  description: v.optional(v.string()),
  category: v.optional(v.string()),
  color: v.optional(v.string()),
  createdAt: v.optional(v.number()),
  createdBy: v.optional(v.string()),
  isActive: v.optional(v.boolean()),
  slug: v.optional(v.string()),
});

export const listMarketingTags = query({
  args: {
    organizationId: v.optional(v.string()),
  },
  returns: v.array(marketingTagValidator),
  handler: async (ctx, args) => {
    const rows =
      typeof args.organizationId === "string"
        ? await ctx.db
            .query("marketingTags")
            .withIndex("by_org", (q) =>
              q.eq("organizationId", args.organizationId),
            )
            .collect()
        : await ctx.db.query("marketingTags").collect();

    return rows.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const getUserMarketingTags = query({
  args: {
    organizationId: v.optional(v.string()),
    userId: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("contactMarketingTags"),
      contactId: v.id("contacts"),
      marketingTag: marketingTagValidator,
      source: v.optional(v.string()),
      assignedBy: v.optional(v.string()),
      assignedAt: v.number(),
      expiresAt: v.optional(v.number()),
      notes: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const contact =
      typeof args.organizationId === "string"
        ? await ctx.db
            .query("contacts")
            .withIndex("by_org_and_userId", (q) =>
              q
                .eq("organizationId", args.organizationId)
                .eq("userId", args.userId),
            )
            .first()
        : await ctx.db
            .query("contacts")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();

    if (!contact) {
      return [];
    }

    const allAssignments = await ctx.db
      .query("contactMarketingTags")
      .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
      .collect();

    const assignments =
      typeof args.organizationId === "string"
        ? allAssignments.filter(
            (row) =>
              row.organizationId === args.organizationId ||
              row.organizationId === undefined,
          )
        : allAssignments;

    const enriched = await Promise.all(
      assignments.map(async (assignment) => {
        const tag = await ctx.db.get(assignment.marketingTagId);
        if (!tag) return null;
        return {
          _id: assignment._id,
          contactId: assignment.contactId,
          marketingTag: tag,
          source: assignment.source,
          assignedBy: assignment.assignedBy,
          assignedAt: assignment.assignedAt,
          expiresAt: assignment.expiresAt,
          notes: assignment.notes,
        };
      }),
    );

    return enriched.filter(
      (item): item is NonNullable<typeof item> => item !== null,
    );
  },
});

export const getContactMarketingTags = query({
  args: {
    organizationId: v.optional(v.string()),
    contactId: v.id("contacts"),
  },
  returns: v.array(
    v.object({
      _id: v.id("contactMarketingTags"),
      contactId: v.id("contacts"),
      marketingTag: marketingTagValidator,
      source: v.optional(v.string()),
      assignedBy: v.optional(v.string()),
      assignedAt: v.number(),
      expiresAt: v.optional(v.number()),
      notes: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const allAssignments = await ctx.db
      .query("contactMarketingTags")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .collect();

    const assignments =
      typeof args.organizationId === "string"
        ? allAssignments.filter(
            (row) =>
              row.organizationId === args.organizationId ||
              row.organizationId === undefined,
          )
        : allAssignments;

    const enriched = await Promise.all(
      assignments.map(async (assignment) => {
        const tag = await ctx.db.get(assignment.marketingTagId);
        if (!tag) return null;
        return {
          _id: assignment._id,
          contactId: assignment.contactId,
          marketingTag: tag,
          source: assignment.source,
          assignedBy: assignment.assignedBy,
          assignedAt: assignment.assignedAt,
          expiresAt: assignment.expiresAt,
          notes: assignment.notes,
        };
      }),
    );

    return enriched.filter(
      (item): item is NonNullable<typeof item> => item !== null,
    );
  },
});

export const getContactIdForUser = query({
  args: {
    organizationId: v.optional(v.string()),
    userId: v.string(),
  },
  returns: v.union(v.id("contacts"), v.null()),
  handler: async (ctx, args) => {
    const contact =
      typeof args.organizationId === "string"
        ? await ctx.db
            .query("contacts")
            .withIndex("by_org_and_userId", (q) =>
              q
                .eq("organizationId", args.organizationId)
                .eq("userId", args.userId),
            )
            .first()
        : await ctx.db
            .query("contacts")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();

    return contact?._id ?? null;
  },
});

export const contactHasMarketingTags = query({
  args: {
    organizationId: v.optional(v.string()),
    contactId: v.id("contacts"),
    tagSlugs: v.array(v.string()),
    requireAll: v.optional(v.boolean()),
  },
  returns: v.object({
    hasAccess: v.boolean(),
    matchingTags: v.array(v.string()),
    missingTags: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const normalizedSlugs = Array.from(
      new Set(args.tagSlugs.map((s) => s.trim().toLowerCase()).filter(Boolean)),
    );
    if (normalizedSlugs.length === 0) {
      return { hasAccess: false, matchingTags: [], missingTags: [] };
    }

    const allAssignments = await ctx.db
      .query("contactMarketingTags")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .collect();

    const assignments =
      typeof args.organizationId === "string"
        ? allAssignments.filter(
            (row) =>
              row.organizationId === args.organizationId ||
              row.organizationId === undefined,
          )
        : allAssignments;

    const tagSlugs = await Promise.all(
      assignments.map(async (assignment) => {
        const tag = await ctx.db.get(assignment.marketingTagId);
        return typeof tag?.slug === "string" ? tag.slug.toLowerCase() : null;
      }),
    );
    const owned = new Set(tagSlugs.filter((v): v is string => Boolean(v)));

    const matching = normalizedSlugs.filter((slug) => owned.has(slug));
    const missing = normalizedSlugs.filter((slug) => !owned.has(slug));

    const requireAll = args.requireAll ?? false;
    const hasAccess = requireAll ? missing.length === 0 : matching.length > 0;

    return {
      hasAccess,
      matchingTags: matching,
      missingTags: missing,
    };
  },
});
