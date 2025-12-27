import { v } from "convex/values";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { components as componentsTyped } from "../../../_generated/api";
import { query } from "../../../_generated/server";

const disclaimersPostsQueries: any = (componentsTyped as any).launchthat_disclaimers
  .posts.queries;

export const getAllPosts = query({
  args: {
    organizationId: v.optional(v.string()),
    filters: v.optional(
      v.object({
        status: v.optional(
          v.union(v.literal("published"), v.literal("draft"), v.literal("archived")),
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
    return await ctx.runQuery(disclaimersPostsQueries.getAllPosts, args);
  },
});

export const getPostById = query({
  args: { id: v.string(), organizationId: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(disclaimersPostsQueries.getPostById, {
      id: args.id as any,
      organizationId: args.organizationId,
    });
  },
});

export const getPostBySlug = query({
  args: { slug: v.string(), organizationId: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(disclaimersPostsQueries.getPostBySlug, args);
  },
});

export const getPostMeta = query({
  args: { postId: v.string(), organizationId: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(disclaimersPostsQueries.getPostMeta, {
      postId: args.postId as any,
      organizationId: args.organizationId,
    });
  },
});


