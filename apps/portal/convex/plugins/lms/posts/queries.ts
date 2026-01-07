// @ts-nocheck
import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { query } from "../../../_generated/server";

const lmsPostsQueries = components.launchthat_lms.posts.queries as any;

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
    return (await ctx.runQuery(lmsPostsQueries.getAllPosts, args));
  },
});

export const getPostById = query({
  args: {
    id: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return (await ctx.runQuery(lmsPostsQueries.getPostById, args));
  },
});

export const getPostBySlug = query({
  args: {
    slug: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return (await ctx.runQuery(lmsPostsQueries.getPostBySlug, args));
  },
});

export const getPostMeta = query({
  args: {
    postId: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return (await ctx.runQuery(lmsPostsQueries.getPostMeta, args));
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
    return (await ctx.runQuery(lmsPostsQueries.searchPosts, args));
  },
});

export const getPostTags = query({
  args: {
    organizationId: v.optional(v.string()),
    postTypeSlug: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return (await ctx.runQuery(lmsPostsQueries.getPostTags, args));
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
      lmsPostsQueries.getPostCategories,
      args,
    ));
  },
});

export const listPostsWithMetaKey = query({
  args: {
    key: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return (await ctx.runQuery(lmsPostsQueries.listPostsWithMetaKey, args));
  },
});


