import { ConvexError, v } from "convex/values";

import { mutation, query } from "../../../_generated/server";
import { requireAdmin } from "../../../lib/permissions/requirePermission";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const marketingTagValidator = v.object({
  _id: v.id("marketingTags"),
  _creationTime: v.number(),
  name: v.string(),
  description: v.optional(v.string()),
  category: v.optional(v.string()),
  color: v.optional(v.string()),
  createdAt: v.optional(v.number()),
  createdBy: v.optional(v.id("users")),
  isActive: v.optional(v.boolean()),
  slug: v.optional(v.string()),
});

export const listMarketingTags = query({
  args: {},
  returns: v.array(marketingTagValidator),
  handler: async (ctx) => {
    const tags = await ctx.db.query("marketingTags").collect();
    return tags.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const createMarketingTag = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    color: v.optional(v.string()),
    slug: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.id("marketingTags"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const now = Date.now();
    const slug = args.slug
      ? slugify(args.slug)
      : slugify(args.name) || `tag-${now}`;

    const existingSlug = await ctx.db
      .query("marketingTags")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (existingSlug) {
      throw new ConvexError("A tag with this slug already exists");
    }

    const identity = await ctx.auth.getUserIdentity();
    const createdByUser =
      identity &&
      (await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .first());

    return await ctx.db.insert("marketingTags", {
      name: args.name,
      description: args.description,
      category: args.category,
      color: args.color,
      slug,
      isActive: args.isActive ?? true,
      createdAt: now,
      createdBy: createdByUser?._id,
    });
  },
});

export const assignMarketingTagToUser = mutation({
  args: {
    userId: v.id("users"),
    marketingTagId: v.id("marketingTags"),
    source: v.optional(v.string()),
    assignedBy: v.optional(v.id("users")),
    expiresAt: v.optional(v.number()),
  },
  returns: v.id("userMarketingTags"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Authentication required");
    }

    const actingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!actingUser) {
      throw new ConvexError("User not found");
    }

    const isSelf = actingUser._id === args.userId;
    if (actingUser.role !== "admin" && !isSelf) {
      throw new ConvexError("Permission denied");
    }

    const tag = await ctx.db.get(args.marketingTagId);
    if (!tag) {
      throw new ConvexError("Marketing tag not found");
    }

    const existingAssignment = await ctx.db
      .query("userMarketingTags")
      .withIndex("by_user_tag", (q) =>
        q.eq("userId", args.userId).eq("marketingTagId", args.marketingTagId),
      )
      .first();

    const payload = {
      source: args.source ?? "admin_manual",
      assignedBy: args.assignedBy ?? actingUser._id,
      expiresAt: args.expiresAt,
      assignedAt: Date.now(),
    };

    if (existingAssignment) {
      await ctx.db.patch(existingAssignment._id, payload);
      return existingAssignment._id;
    }

    return await ctx.db.insert("userMarketingTags", {
      userId: args.userId,
      marketingTagId: args.marketingTagId,
      ...payload,
    });
  },
});

export const removeMarketingTagFromUser = mutation({
  args: {
    userId: v.id("users"),
    marketingTagId: v.id("marketingTags"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Authentication required");
    }

    const actingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!actingUser) {
      throw new ConvexError("User not found");
    }

    const isSelf = actingUser._id === args.userId;
    if (actingUser.role !== "admin" && !isSelf) {
      throw new ConvexError("Permission denied");
    }

    const assignment = await ctx.db
      .query("userMarketingTags")
      .withIndex("by_user_tag", (q) =>
        q.eq("userId", args.userId).eq("marketingTagId", args.marketingTagId),
      )
      .first();

    if (!assignment) {
      return false;
    }

    await ctx.db.delete(assignment._id);
    return true;
  },
});

export const getUserMarketingTags = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(
    v.object({
      _id: v.id("userMarketingTags"),
      userId: v.id("users"),
      marketingTag: marketingTagValidator,
      source: v.optional(v.string()),
      assignedBy: v.optional(v.id("users")),
      assignedAt: v.number(),
      expiresAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("userMarketingTags")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const enriched = await Promise.all(
      assignments.map(async (assignment) => {
        const tag = await ctx.db.get(assignment.marketingTagId);
        if (!tag) {
          return null;
        }
        return {
          _id: assignment._id,
          userId: assignment.userId,
          marketingTag: tag,
          source: assignment.source,
          assignedBy: assignment.assignedBy,
          assignedAt: assignment.assignedAt,
          expiresAt: assignment.expiresAt,
        };
      }),
    );

    return enriched.filter(
      (item): item is NonNullable<typeof item> => item !== null,
    );
  },
});

export const userHasMarketingTags = query({
  args: {
    userId: v.id("users"),
    tagSlugs: v.array(v.string()),
    requireAll: v.optional(v.boolean()),
  },
  returns: v.object({
    hasAccess: v.boolean(),
    matchingTags: v.array(v.string()),
    missingTags: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    if (args.tagSlugs.length === 0) {
      return { hasAccess: false, matchingTags: [], missingTags: [] };
    }

    const assignments = await ctx.db
      .query("userMarketingTags")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    if (assignments.length === 0) {
      return {
        hasAccess: false,
        matchingTags: [],
        missingTags: args.tagSlugs,
      };
    }

    const tagDocs = await Promise.all(
      assignments.map((assignment) => ctx.db.get(assignment.marketingTagId)),
    );

    const userSlugs = tagDocs
      .filter((tag): tag is NonNullable<typeof tag> => tag !== null)
      .map((tag) => tag.slug ?? slugify(tag.name));

    const userSlugSet = new Set(userSlugs);
    const matchingTags = args.tagSlugs.filter((slug) => userSlugSet.has(slug));
    const missingTags = args.tagSlugs.filter((slug) => !userSlugSet.has(slug));

    const hasAccess = args.requireAll
      ? missingTags.length === 0 && matchingTags.length > 0
      : matchingTags.length > 0;

    return {
      hasAccess,
      matchingTags,
      missingTags,
    };
  },
});
