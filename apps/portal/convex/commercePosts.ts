import { v } from "convex/values";

import { components } from "./_generated/api";
import { mutation, query } from "./_generated/server";

const commercePostsQueries = components.launchthat_ecommerce.posts.queries;
const commercePostsMutations = components.launchthat_ecommerce.posts.mutations;

const commercePostValidator = v.object({
  _id: v.string(),
  _creationTime: v.number(),
  title: v.string(),
  content: v.optional(v.string()),
  excerpt: v.optional(v.string()),
  slug: v.string(),
  status: v.string(),
  category: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  featuredImageUrl: v.optional(v.string()),
  postTypeSlug: v.string(),
  organizationId: v.optional(v.string()),
  authorId: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

const commercePostMetaValidator = v.object({
  _id: v.string(),
  _creationTime: v.number(),
  postId: v.string(),
  key: v.string(),
  value: v.optional(v.union(v.string(), v.number(), v.boolean(), v.null())),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

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
  returns: v.array(commercePostValidator),
  handler: async (ctx, args) => {
    return await ctx.runQuery(commercePostsQueries.getAllPosts, args);
  },
});

export const getPostById = query({
  args: {
    id: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.union(commercePostValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.runQuery(commercePostsQueries.getPostById, args);
  },
});

export const getPostBySlug = query({
  args: {
    slug: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.union(commercePostValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.runQuery(commercePostsQueries.getPostBySlug, args);
  },
});

export const getPostMeta = query({
  args: {
    postId: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.array(commercePostMetaValidator),
  handler: async (ctx, args) => {
    return await ctx.runQuery(commercePostsQueries.getPostMeta, args);
  },
});

export const searchPosts = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
    organizationId: v.optional(v.string()),
    postTypeSlug: v.optional(v.string()),
  },
  returns: v.array(commercePostValidator),
  handler: async (ctx, args) => {
    return await ctx.runQuery(commercePostsQueries.searchPosts, args);
  },
});

export const getPostTags = query({
  args: {
    organizationId: v.optional(v.string()),
    postTypeSlug: v.optional(v.string()),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    return await ctx.runQuery(commercePostsQueries.getPostTags, args);
  },
});

export const getPostCategories = query({
  args: {
    organizationId: v.optional(v.string()),
    postTypeSlug: v.optional(v.string()),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    return await ctx.runQuery(commercePostsQueries.getPostCategories, args);
  },
});

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
    return await ctx.runMutation(commercePostsMutations.createPost, args);
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
    return await ctx.runMutation(commercePostsMutations.updatePost, args);
  },
});

export const deletePost = mutation({
  args: {
    id: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(commercePostsMutations.deletePost, args);
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
    return await ctx.runMutation(commercePostsMutations.updatePostStatus, args);
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
    return await ctx.runMutation(
      commercePostsMutations.bulkUpdatePostStatus,
      args,
    );
  },
});
