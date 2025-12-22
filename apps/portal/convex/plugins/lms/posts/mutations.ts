import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { mutation } from "../../../_generated/server";

const lmsPostsMutations = components.launchthat_lms.posts.mutations;

export const createPost = mutation({
  args: {
    title: v.string(),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    slug: v.string(),
    status: v.union(
      v.literal("published"),
      v.literal("draft"),
      v.literal("archived"),
    ),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    featuredImage: v.optional(v.string()),
    postTypeSlug: v.string(),
    meta: v.optional(
      v.record(
        v.string(),
        v.union(v.string(), v.number(), v.boolean(), v.null()),
      ),
    ),
    organizationId: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(lmsPostsMutations.createPost, args);
  },
});

export const updatePost = mutation({
  args: {
    id: v.string(),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    slug: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("published"),
        v.literal("draft"),
        v.literal("archived"),
      ),
    ),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    featuredImage: v.optional(v.string()),
    meta: v.optional(
      v.record(
        v.string(),
        v.union(v.string(), v.number(), v.boolean(), v.null()),
      ),
    ),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(lmsPostsMutations.updatePost, args);
  },
});

export const deletePost = mutation({
  args: {
    id: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(lmsPostsMutations.deletePost, args);
  },
});

export const updatePostStatus = mutation({
  args: {
    id: v.string(),
    status: v.union(
      v.literal("published"),
      v.literal("draft"),
      v.literal("archived"),
    ),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(lmsPostsMutations.updatePostStatus, args);
  },
});

export const bulkUpdatePostStatus = mutation({
  args: {
    ids: v.array(v.string()),
    status: v.union(
      v.literal("published"),
      v.literal("draft"),
      v.literal("archived"),
    ),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    return await ctx.runMutation(lmsPostsMutations.bulkUpdatePostStatus, args);
  },
});


