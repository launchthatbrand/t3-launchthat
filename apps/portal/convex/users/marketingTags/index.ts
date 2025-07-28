import { mutation, query } from "../../_generated/server";

import { v } from "convex/values";

/**
 * Marketing Tags Queries
 */

// Get all marketing tags with optional filtering
export const listMarketingTags = query({
  args: {
    category: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("marketingTags"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      description: v.optional(v.string()),
      color: v.optional(v.string()),
      category: v.optional(v.string()),
      isActive: v.optional(v.boolean()),
      createdBy: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    if (args.category) {
      return await ctx.db
        .query("marketingTags")
        .withIndex("by_category", (q) => q.eq("category", args.category))
        .collect();
    }

    if (args.isActive !== undefined) {
      return await ctx.db
        .query("marketingTags")
        .withIndex("by_active", (q) => q.eq("isActive", args.isActive))
        .collect();
    }

    return await ctx.db.query("marketingTags").collect();
  },
});

// Get marketing tags for a specific user
export const getUserMarketingTags = query({
  args: {
    userId: v.id("users"),
    includeInactive: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("userMarketingTags"),
      _creationTime: v.number(),
      marketingTag: v.object({
        _id: v.id("marketingTags"),
        name: v.string(),
        slug: v.string(),
        description: v.optional(v.string()),
        color: v.optional(v.string()),
        category: v.optional(v.string()),
      }),
      assignedBy: v.optional(v.id("users")),
      assignedAt: v.number(),
      source: v.optional(v.string()),
      expiresAt: v.optional(v.number()),
      isActive: v.optional(v.boolean()),
    }),
  ),
  handler: async (ctx, args) => {
    let assignments = await ctx.db
      .query("userMarketingTags")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    if (!args.includeInactive) {
      assignments = assignments.filter((a) => a.isActive !== false);
    }

    // Get the marketing tag details for each assignment
    const assignmentsWithTags = await Promise.all(
      assignments.map(async (assignment) => {
        const marketingTag = await ctx.db.get(assignment.marketingTagId);
        if (!marketingTag) return null;

        return {
          _id: assignment._id,
          _creationTime: assignment._creationTime,
          marketingTag: {
            _id: marketingTag._id,
            name: marketingTag.name,
            slug: marketingTag.slug,
            description: marketingTag.description,
            color: marketingTag.color,
            category: marketingTag.category,
          },
          assignedBy: assignment.assignedBy,
          assignedAt: assignment.assignedAt,
          source: assignment.source,
          expiresAt: assignment.expiresAt,
          isActive: assignment.isActive,
        };
      }),
    );

    return assignmentsWithTags.filter((item) => item !== null) as NonNullable<
      (typeof assignmentsWithTags)[0]
    >[];
  },
});

// Check if user has specific marketing tag(s)
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
    const userTags = await ctx.db
      .query("userMarketingTags")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", args.userId).eq("isActive", true),
      )
      .collect();

    // Get the marketing tag details
    const userTagSlugs = await Promise.all(
      userTags.map(async (assignment) => {
        const tag = await ctx.db.get(assignment.marketingTagId);
        return tag?.slug;
      }),
    );

    const validUserTagSlugs = userTagSlugs.filter(
      (slug): slug is string => slug !== undefined,
    );
    const matchingTags = args.tagSlugs.filter((slug) =>
      validUserTagSlugs.includes(slug),
    );
    const missingTags = args.tagSlugs.filter(
      (slug) => !validUserTagSlugs.includes(slug),
    );

    const hasAccess = args.requireAll
      ? missingTags.length === 0
      : matchingTags.length > 0;

    return {
      hasAccess,
      matchingTags,
      missingTags,
    };
  },
});

/**
 * Marketing Tags Mutations
 */

// Create a new marketing tag
export const createMarketingTag = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    category: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.id("marketingTags"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) throw new Error("User not found");

    // Check if slug already exists
    const existingTag = await ctx.db
      .query("marketingTags")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existingTag) throw new Error("A tag with this slug already exists");

    const now = Date.now();
    return await ctx.db.insert("marketingTags", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      color: args.color,
      category: args.category,
      isActive: args.isActive ?? true,
      createdBy: user._id,
      createdAt: now,
    });
  },
});

// Assign marketing tag to user
export const assignMarketingTagToUser = mutation({
  args: {
    userId: v.id("users"),
    marketingTagId: v.id("marketingTags"),
    source: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  returns: v.id("userMarketingTags"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const assignedByUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!assignedByUser) throw new Error("User not found");

    // Check if user and tag exist
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Target user not found");

    const tag = await ctx.db.get(args.marketingTagId);
    if (!tag) throw new Error("Marketing tag not found");

    // Check if assignment already exists
    const existingAssignment = await ctx.db
      .query("userMarketingTags")
      .withIndex("by_user_tag", (q) =>
        q.eq("userId", args.userId).eq("marketingTagId", args.marketingTagId),
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .unique();

    if (existingAssignment) {
      throw new Error("User already has this marketing tag");
    }

    const now = Date.now();
    return await ctx.db.insert("userMarketingTags", {
      userId: args.userId,
      marketingTagId: args.marketingTagId,
      assignedBy: assignedByUser._id,
      assignedAt: now,
      source: args.source ?? "manual",
      expiresAt: args.expiresAt,
      isActive: true,
    });
  },
});

// Remove marketing tag from user
export const removeMarketingTagFromUser = mutation({
  args: {
    userId: v.id("users"),
    marketingTagId: v.id("marketingTags"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Find active assignment
    const assignment = await ctx.db
      .query("userMarketingTags")
      .withIndex("by_user_tag", (q) =>
        q.eq("userId", args.userId).eq("marketingTagId", args.marketingTagId),
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .unique();

    if (!assignment) {
      throw new Error("User does not have this marketing tag");
    }

    // Mark as inactive instead of deleting for audit trail
    await ctx.db.patch(assignment._id, {
      isActive: false,
    });

    return null;
  },
});
