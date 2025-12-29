import { v } from "convex/values";

import { components, internal } from "../../../_generated/api";
import { mutation } from "../../../_generated/server";

const lmsPostsMutations = components.launchthat_lms.posts.mutations;
const lmsPostsQueries = components.launchthat_lms.posts.queries as unknown as {
  getPostByIdInternal: unknown;
};

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
    const id = await ctx.runMutation(lmsPostsMutations.createPost, args);
    await ctx.scheduler.runAfter(0, internal.plugins.support.rag.ingestLmsPostIfConfigured, {
      id,
      postTypeSlug: args.postTypeSlug,
    });
    return id;
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
    const id = await ctx.runMutation(lmsPostsMutations.updatePost, args);
    const post = (await ctx.runQuery(
      lmsPostsQueries.getPostByIdInternal as any,
      { id },
    )) as { postTypeSlug?: string } | null;
    if (post?.postTypeSlug) {
      await ctx.scheduler.runAfter(0, internal.plugins.support.rag.ingestLmsPostIfConfigured, {
        id,
        postTypeSlug: post.postTypeSlug,
      });
    }
    return id;
  },
});

export const deletePost = mutation({
  args: {
    id: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const post = (await ctx.runQuery(
      lmsPostsQueries.getPostByIdInternal as any,
      { id: args.id },
    )) as { postTypeSlug?: string; organizationId?: string } | null;
    await ctx.runMutation(lmsPostsMutations.deletePost, args);
    if (post?.postTypeSlug && post?.organizationId) {
      await ctx.scheduler.runAfter(0, internal.plugins.support.rag.removeLmsEntry, {
        organizationId: post.organizationId as any,
        postTypeSlug: post.postTypeSlug,
        id: args.id,
      });
    }
    return null;
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
    const id = await ctx.runMutation(lmsPostsMutations.updatePostStatus, args);
    const post = (await ctx.runQuery(
      lmsPostsQueries.getPostByIdInternal as any,
      { id },
    )) as { postTypeSlug?: string } | null;
    if (post?.postTypeSlug) {
      await ctx.scheduler.runAfter(0, internal.plugins.support.rag.ingestLmsPostIfConfigured, {
        id,
        postTypeSlug: post.postTypeSlug,
      });
    }
    return id;
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


