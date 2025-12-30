// @ts-nocheck
import { v } from "convex/values";

import { components } from "../../_generated/api";
import { query } from "../../_generated/server";

const commercePostsQueries = components.launchthat_ecommerce.posts
  .queries as any;

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
    return (await ctx.runQuery(
      commercePostsQueries.getAllPosts as any,
      args,
    )) as any;
  },
});

export const getPostById = query({
  args: {
    id: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return (await ctx.runQuery(
      commercePostsQueries.getPostById as any,
      args,
    )) as any;
  },
});

export const getPostBySlug = query({
  args: {
    slug: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return (await ctx.runQuery(
      commercePostsQueries.getPostBySlug as any,
      args,
    )) as any;
  },
});

export const getPostMeta = query({
  args: {
    postId: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return (await ctx.runQuery(
      commercePostsQueries.getPostMeta as any,
      args,
    )) as any;
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
    return (await ctx.runQuery(
      commercePostsQueries.searchPosts as any,
      args,
    )) as any;
  },
});

export const getPostTags = query({
  args: {
    organizationId: v.optional(v.string()),
    postTypeSlug: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return (await ctx.runQuery(
      commercePostsQueries.getPostTags as any,
      args,
    )) as any;
  },
});

export const getPostCategories = query({
  args: {
    organizationId: v.optional(v.string()),
    postTypeSlug: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return (await ctx.runQuery(
      commercePostsQueries.getPostCategories as any,
      args,
    )) as any;
  },
});










