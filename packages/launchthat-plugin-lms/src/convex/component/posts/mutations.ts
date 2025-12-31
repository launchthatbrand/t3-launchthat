import { v } from "convex/values";

import { mutation } from "../_generated/server";
import { ensureUniqueSlug, metaValueValidator, sanitizeSlug, upsertPostMeta } from "./helpers";

export const createPost = mutation({
  args: {
    title: v.string(),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    slug: v.string(),
    status: v.union(v.literal("published"), v.literal("draft"), v.literal("archived")),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    featuredImage: v.optional(v.string()),
    postTypeSlug: v.string(),
    meta: v.optional(v.record(v.string(), metaValueValidator)),
    organizationId: v.optional(v.string()),
  },
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    const normalizedSlug =
      sanitizeSlug(args.slug) || `${args.postTypeSlug}-${Date.now()}`;
    const uniqueSlug = await ensureUniqueSlug(
      ctx,
      normalizedSlug,
      args.organizationId ?? undefined,
    );
    const timestamp = Date.now();

    const identity = await ctx.auth.getUserIdentity();
    const authorId =
      identity?.subject ?? identity?.tokenIdentifier ?? undefined;

    const postId = await ctx.db.insert("posts", {
      title: args.title,
      content: args.content,
      excerpt: args.excerpt,
      slug: uniqueSlug,
      status: args.status,
      category: args.category,
      tags: args.tags,
      featuredImageUrl: args.featuredImage,
      postTypeSlug: args.postTypeSlug.toLowerCase(),
      organizationId: args.organizationId ?? undefined,
      authorId,
      createdAt: timestamp,
    });

    if (args.meta && Object.keys(args.meta).length > 0) {
      await upsertPostMeta(ctx, postId, args.meta);
    }

    return postId;
  },
});

export const updatePost = mutation({
  args: {
    id: v.id("posts"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    slug: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("published"), v.literal("draft"), v.literal("archived")),
    ),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    featuredImage: v.optional(v.string()),
    meta: v.optional(v.record(v.string(), metaValueValidator)),
    organizationId: v.optional(v.string()),
  },
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    const { id, meta, organizationId, ...updates } = args;
    const post = await ctx.db.get(id);
    if (!post) {
      throw new Error(`Post with ID ${id} not found`);
    }

    if (organizationId && post.organizationId !== organizationId) {
      throw new Error("Post not found for organization");
    }

    if (updates.slug) {
      const sanitized = sanitizeSlug(updates.slug);
      const normalizedSlug =
        sanitized.length > 0 ? sanitized : (post.slug ?? `post-${Date.now()}`);
      if (normalizedSlug !== post.slug) {
        updates.slug = await ensureUniqueSlug(
          ctx,
          normalizedSlug,
          post.organizationId ?? undefined,
          id,
        );
      }
    }

    await ctx.db.patch(id, {
      ...updates,
      featuredImageUrl: updates.featuredImage ?? post.featuredImageUrl,
      updatedAt: Date.now(),
    });

    if (meta && Object.keys(meta).length > 0) {
      await upsertPostMeta(ctx, id, meta);
    }

    return id;
  },
});

export const deletePost = mutation({
  args: {
    id: v.id("posts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    const metaEntries = await ctx.db
      .query("postsMeta")
      .withIndex("by_post", (q) => q.eq("postId", args.id))
      .collect();
    await Promise.all(metaEntries.map((entry) => ctx.db.delete(entry._id)));
    return null;
  },
});

export const updatePostStatus = mutation({
  args: {
    id: v.id("posts"),
    status: v.union(v.literal("published"), v.literal("draft"), v.literal("archived")),
  },
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const bulkUpdatePostStatus = mutation({
  args: {
    ids: v.array(v.id("posts")),
    status: v.union(v.literal("published"), v.literal("draft"), v.literal("archived")),
  },
  returns: v.array(v.id("posts")),
  handler: async (ctx, args) => {
    await Promise.all(
      args.ids.map((id) =>
        ctx.db.patch(id, { status: args.status, updatedAt: Date.now() }),
      ),
    );
    return args.ids;
  },
});

export const deletePostMetaKey = mutation({
  args: {
    postId: v.id("posts"),
    key: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("postsMeta")
      .withIndex("by_post_and_key", (q) =>
        q.eq("postId", args.postId).eq("key", args.key),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});


