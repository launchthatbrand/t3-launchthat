// @ts-nocheck
import { v } from "convex/values";

import { components } from "../_generated/api";
import { query } from "../_generated/server";

const ecommercePostsQueries = components.launchthat_ecommerce.posts.queries as any;

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
    return (await ctx.runQuery(ecommercePostsQueries.getAllPosts, args));
  },
});

export const getPostById = query({
  args: {
    id: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return (await ctx.runQuery(ecommercePostsQueries.getPostById, {
      id: args.id as any,
      organizationId: args.organizationId,
    }));
  },
});

export const getPostBySlug = query({
  args: {
    slug: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return (await ctx.runQuery(ecommercePostsQueries.getPostBySlug, args));
  },
});

export const getPostMeta = query({
  args: {
    postId: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return (await ctx.runQuery(ecommercePostsQueries.getPostMeta, {
      postId: args.postId as any,
      organizationId: args.organizationId,
    }));
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
    return (await ctx.runQuery(ecommercePostsQueries.searchPosts, args));
  },
});

export const getPostTags = query({
  args: {
    organizationId: v.optional(v.string()),
    postTypeSlug: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return (await ctx.runQuery(ecommercePostsQueries.getPostTags, args));
  },
});

export const getPostCategories = query({
  args: {
    organizationId: v.optional(v.string()),
    postTypeSlug: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return (await ctx.runQuery(ecommercePostsQueries.getPostCategories, args));
  },
});


