/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { components as componentsTyped } from "../../../_generated/api";
import { mutation } from "../../../_generated/server";

const disclaimersPostsMutations: any = (componentsTyped as any)
  .launchthat_disclaimers.posts.mutations;

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
    const result: unknown = await ctx.runMutation(
      disclaimersPostsMutations.createPost,
      args as any,
    );
    return String(result);
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
    const result: unknown = await ctx.runMutation(
      disclaimersPostsMutations.updatePost,
      args as any,
    );
    return String(result);
  },
});

export const deletePost = mutation({
  args: { id: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(disclaimersPostsMutations.deletePost, {
      id: args.id as any,
    });
    return null;
  },
});
