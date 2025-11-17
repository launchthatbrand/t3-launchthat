/**
 * Posts Queries
 *
 * This module provides query endpoints for posts.
 */
import { v } from "convex/values";

import { query } from "../../_generated/server";
import { isAdmin } from "../../lib/permissions/hasPermission";

/**
 * Get all posts with optional filtering
 */
export const getAllPosts = query({
  args: {
    organizationId: v.optional(v.id("organizations")),
    filters: v.optional(
      v.object({
        status: v.optional(
          v.union(
            v.literal("published"),
            v.literal("draft"),
            v.literal("archived"),
          ),
        ),
        category: v.optional(v.string()),
        authorId: v.optional(v.id("users")),
        limit: v.optional(v.number()),
        postTypeSlug: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const organizationId = args.organizationId ?? undefined;

    let queryBuilder;
    if (organizationId) {
      if (args.filters?.postTypeSlug) {
        queryBuilder = ctx.db
          .query("posts")
          .withIndex("by_organization_postTypeSlug", (q) =>
            q
              .eq("organizationId", organizationId)
              .eq("postTypeSlug", args.filters?.postTypeSlug ?? ""),
          );
      } else {
        queryBuilder = ctx.db
          .query("posts")
          .withIndex("by_organization", (q) =>
            q.eq("organizationId", organizationId),
          );
      }
    } else if (args.filters?.postTypeSlug) {
      queryBuilder = ctx.db
        .query("posts")
        .withIndex("by_postTypeSlug", (q) =>
          q.eq("postTypeSlug", args.filters?.postTypeSlug ?? ""),
        )
        .filter((q) => q.eq(q.field("organizationId"), undefined));
    } else {
      queryBuilder = ctx.db
        .query("posts")
        .filter((q) => q.eq(q.field("organizationId"), undefined));
    }

    if (args.filters?.status) {
      queryBuilder = queryBuilder.filter((q) =>
        q.eq(q.field("status"), args.filters?.status),
      );
    }

    if (args.filters?.category) {
      queryBuilder = queryBuilder.filter((q) =>
        q.eq(q.field("category"), args.filters?.category),
      );
    }

    if (args.filters?.authorId) {
      queryBuilder = queryBuilder.filter((q) =>
        q.eq(q.field("authorId"), args.filters?.authorId),
      );
    }

    const posts = await queryBuilder
      .order("desc")
      .take(args.filters?.limit ?? 50);

    return posts;
  },
});

/**
 * Get a post by ID
 */
export const getPostById = query({
  args: {
    id: v.id("posts"),
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (!post) {
      return null;
    }

    const requestedOrg = args.organizationId ?? undefined;
    const postOrg = post.organizationId ?? undefined;
    if (requestedOrg !== postOrg) {
      return null;
    }

    return post;
  },
});

export const getPostMeta = query({
  args: {
    postId: v.id("posts"),
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      return [];
    }
    const requestedOrg = args.organizationId ?? undefined;
    const postOrg = post.organizationId ?? undefined;
    if (requestedOrg !== postOrg) {
      return [];
    }

    return await ctx.db
      .query("postsMeta")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
  },
});

/**
 * Get a post by slug
 */
export const getPostBySlug = query({
  args: {
    slug: v.string(),
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const requestedOrg = args.organizationId ?? undefined;

    const post = requestedOrg
      ? await ctx.db
          .query("posts")
          .withIndex("by_organization_slug", (q) =>
            q.eq("organizationId", requestedOrg).eq("slug", args.slug),
          )
          .unique()
      : await ctx.db
          .query("posts")
          .withIndex("by_slug", (q) => q.eq("slug", args.slug))
          .filter((q) => q.eq(q.field("organizationId"), undefined))
          .first();

    if (!post) {
      return null;
    }

    const status = (post.status ?? "published").toLowerCase();
    const isDraftOrArchived =
      status === "draft" || status === "archived" || status === "private";

    if (isDraftOrArchived) {
      const adminUser = await isAdmin(ctx);
      if (!adminUser) {
        return null;
      }
    }

    return post;
  },
});

/**
 * Search posts by content
 */
export const searchPosts = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const organizationId = args.organizationId ?? undefined;
    const posts = await ctx.db
      .query("posts")
      .filter((q) =>
        q.eq(q.field("organizationId"), organizationId ?? undefined),
      )
      .filter((q) =>
        q.or(
          q.eq(q.field("title"), args.searchTerm),
          q.eq(q.field("content"), args.searchTerm),
        ),
      )
      .take(args.limit ?? 20);

    return posts;
  },
});

/**
 * Get all post tags
 */
export const getPostTags = query({
  args: { organizationId: v.optional(v.id("organizations")) },
  handler: async (ctx, args) => {
    const organizationId = args.organizationId ?? undefined;
    const posts = await ctx.db
      .query("posts")
      .filter((q) =>
        q.eq(q.field("organizationId"), organizationId ?? undefined),
      )
      .collect();
    const tagsSet = new Set<string>();

    posts.forEach((post) => {
      if (post.tags) {
        post.tags.forEach((tag) => tagsSet.add(tag));
      }
    });

    return Array.from(tagsSet).sort();
  },
});

/**
 * Get all post categories
 */
export const getPostCategories = query({
  args: { organizationId: v.optional(v.id("organizations")) },
  handler: async (ctx, _args) => {
    // TODO: Categories should be tenant-scoped; currently shared.
    const postCategories = await ctx.db
      .query("categories")
      .withIndex("by_postTypes", (q) => q.eq("postTypes", ["post"]))
      .collect();
    return postCategories;
  },
});
