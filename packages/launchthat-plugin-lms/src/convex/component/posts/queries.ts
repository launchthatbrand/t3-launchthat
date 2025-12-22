import { v } from "convex/values";

import { query } from "../_generated/server";
import { organizationMatches } from "./helpers";

export const getAllPosts = query({
  args: {
    organizationId: v.optional(v.string()),
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
        authorId: v.optional(v.string()),
        postTypeSlug: v.optional(v.string()),
        limit: v.optional(v.number()),
      }),
    ),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const organizationId = args.organizationId ?? undefined;
    const postTypeSlug = args.filters?.postTypeSlug?.toLowerCase();
    let queryBuilder;

    if (organizationId) {
      if (postTypeSlug) {
        queryBuilder = ctx.db
          .query("posts")
          .withIndex("by_org_postTypeSlug", (q) =>
            q
              .eq("organizationId", organizationId)
              .eq("postTypeSlug", postTypeSlug),
          );
      } else {
        queryBuilder = ctx.db
          .query("posts")
          .withIndex("by_org", (q) => q.eq("organizationId", organizationId));
      }
    } else if (postTypeSlug) {
      queryBuilder = ctx.db
        .query("posts")
        .withIndex("by_postTypeSlug", (q) => q.eq("postTypeSlug", postTypeSlug))
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

export const getPostById = query({
  args: {
    id: v.id("posts"),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (!post) {
      return null;
    }
    if (
      !organizationMatches(
        post.organizationId,
        args.organizationId ?? undefined,
      )
    ) {
      return null;
    }
    return post;
  },
});

export const getPostByIdInternal = query({
  args: {
    id: v.id("posts"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getPostBySlug = query({
  args: {
    slug: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    if (args.organizationId) {
      return await ctx.db
        .query("posts")
        .withIndex("by_org_slug", (q) =>
          q.eq("organizationId", args.organizationId).eq("slug", args.slug),
        )
        .unique();
    }

    return await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .filter((q) => q.eq(q.field("organizationId"), undefined))
      .unique();
  },
});

export const getPostMeta = query({
  args: {
    postId: v.id("posts"),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      return [];
    }
    if (
      !organizationMatches(
        post.organizationId,
        args.organizationId ?? undefined,
      )
    ) {
      return [];
    }
    return await ctx.db
      .query("postsMeta")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
  },
});

export const getPostMetaInternal = query({
  args: {
    postId: v.id("posts"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("postsMeta")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
  },
});

export const searchPosts = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
    organizationId: v.optional(v.string()),
    postTypeSlug: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const organizationId = args.organizationId ?? undefined;
    const slugFilter = args.postTypeSlug?.toLowerCase();
    let queryBuilder = ctx.db
      .query("posts")
      .filter((q) =>
        q.eq(q.field("organizationId"), organizationId ?? undefined),
      );

    if (slugFilter) {
      queryBuilder = queryBuilder.filter((q) =>
        q.eq(q.field("postTypeSlug"), slugFilter),
      );
    }

    const posts = await queryBuilder
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

export const getPostTags = query({
  args: {
    organizationId: v.optional(v.string()),
    postTypeSlug: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const slugFilter = args.postTypeSlug?.toLowerCase();
    let queryBuilder = ctx.db
      .query("posts")
      .filter((q) =>
        q.eq(q.field("organizationId"), args.organizationId ?? undefined),
      );
    if (slugFilter) {
      queryBuilder = queryBuilder.filter((q) =>
        q.eq(q.field("postTypeSlug"), slugFilter),
      );
    }
    const posts = await queryBuilder.collect();

    const tags = new Set<string>();
    posts.forEach((post) => {
      post.tags?.forEach((tag) => tags.add(tag));
    });

    return Array.from(tags).sort();
  },
});

export const getPostCategories = query({
  args: {
    organizationId: v.optional(v.string()),
    postTypeSlug: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const slugFilter = args.postTypeSlug?.toLowerCase();
    let queryBuilder = ctx.db
      .query("posts")
      .filter((q) =>
        q.eq(q.field("organizationId"), args.organizationId ?? undefined),
      );
    if (slugFilter) {
      queryBuilder = queryBuilder.filter((q) =>
        q.eq(q.field("postTypeSlug"), slugFilter),
      );
    }
    const posts = await queryBuilder.collect();

    const categories = new Set<string>();
    posts.forEach((post) => {
      if (post.category) {
        categories.add(post.category);
      }
    });

    return Array.from(categories).sort();
  },
});
