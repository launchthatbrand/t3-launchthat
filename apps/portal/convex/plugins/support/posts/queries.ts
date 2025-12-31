/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
// Public wrapper queries for component-scoped support data.
//
// The Admin editor uses component-backed post types for support content. These
// wrappers delegate to the mounted `launchthat_support` Convex component.
import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { query } from "../../../_generated/server";

const supportPostsQueries = components.launchthat_support.posts.queries as any;

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
        postTypeSlug: v.optional(v.string()),
        limit: v.optional(v.number()),
      }),
    ),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(supportPostsQueries.getAllPosts, args);
  },
});

export const getPostById = query({
  args: {
    id: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(supportPostsQueries.getPostById, args);
  },
});

export const getPostBySlug = query({
  args: {
    slug: v.string(),
    organizationId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(supportPostsQueries.getPostBySlug, args);
  },
});

export const getPostMeta = query({
  args: {
    postId: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(supportPostsQueries.getPostMeta, args);
  },
});


