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
    let queryBuilder = args.filters?.postTypeSlug
      ? ctx.db
          .query("posts")
          .withIndex("by_postTypeSlug", (q) =>
            q.eq("postTypeSlug", args.filters?.postTypeSlug ?? ""),
          )
      : ctx.db.query("posts");

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
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getPostMeta = query({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
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
  },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
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
  },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
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
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").collect();
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
  args: {},
  handler: async (ctx) => {
    const postCategories = await ctx.db
      .query("categories")
      .withIndex("by_postTypes", (q) => q.eq("postTypes", ["post"]))
      .collect();
    return postCategories;
  },
});
