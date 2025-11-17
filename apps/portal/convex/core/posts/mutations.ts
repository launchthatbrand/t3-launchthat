/**
 * Posts Mutations
 *
 * This module provides mutation endpoints for posts.
 */
import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { mutation } from "../../_generated/server";

const metaValueValidator = v.union(
  v.string(),
  v.number(),
  v.boolean(),
  v.null(),
);

const DEFAULT_POST_TYPE = "post";

async function upsertPostMeta(
  ctx: MutationCtx,
  postId: Id<"posts">,
  meta: Record<string, string | number | boolean | null>,
) {
  const timestamp = Date.now();
  for (const [key, value] of Object.entries(meta)) {
    const existing = await ctx.db
      .query("postsMeta")
      .withIndex("by_post_and_key", (q) =>
        q.eq("postId", postId).eq("key", key),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { value, updatedAt: timestamp });
    } else {
      await ctx.db.insert("postsMeta", {
        postId,
        key,
        value,
        createdAt: timestamp,
      });
    }
  }
}

/**
 * Create a new post
 */
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
    postTypeSlug: v.optional(v.string()),
    meta: v.optional(v.record(v.string(), metaValueValidator)),
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    // Get current user if authenticated
    const identity = await ctx.auth.getUserIdentity();
    let authorId;
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .first();
      if (user) {
        authorId = user._id;
      }
    }

    const postTypeSlug = (args.postTypeSlug ?? DEFAULT_POST_TYPE).toLowerCase();
    const normalizedSlug = sanitizeSlug(args.slug) || `post-${Date.now()}`;
    const uniqueSlug = await ensureUniqueSlug(
      ctx,
      normalizedSlug,
      args.organizationId,
    );

    const postId = await ctx.db.insert("posts", {
      title: args.title,
      content: args.content,
      excerpt: args.excerpt,
      slug: uniqueSlug,
      status: args.status,
      category: args.category,
      tags: args.tags,
      featuredImageUrl: args.featuredImage,
      postTypeSlug,
      authorId,
      organizationId: args.organizationId ?? undefined,
      createdAt: Date.now(),
    });

    if (args.meta && Object.keys(args.meta).length > 0) {
      await upsertPostMeta(ctx, postId, args.meta);
    }

    return postId;
  },
});

/**
 * Update an existing post
 */
export const updatePost = mutation({
  args: {
    id: v.id("posts"),
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
    postTypeSlug: v.optional(v.string()),
    meta: v.optional(v.record(v.string(), metaValueValidator)),
  },
  handler: async (ctx, args) => {
    const { id, meta, ...updates } = args;

    const post = await ctx.db.get(id);
    if (!post) {
      throw new Error(`Post with ID ${id} not found`);
    }

    if (updates.slug) {
      const normalizedSlug = sanitizeSlug(updates.slug) || post.slug;
      if (normalizedSlug !== post.slug) {
        updates.slug = await ensureUniqueSlug(
          ctx,
          normalizedSlug,
          post.organizationId as Id<"organizations"> | undefined,
          id,
        );
      }
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    if (meta && Object.keys(meta).length > 0) {
      await upsertPostMeta(ctx, id, meta);
    }

    return id;
  },
});

/**
 * Delete a post
 */
export const deletePost = mutation({
  args: {
    id: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (!post) {
      throw new Error(`Post with ID ${args.id} not found`);
    }

    await ctx.db.delete(args.id);
    return null;
  },
});

/**
 * Update post status
 */
export const updatePostStatus = mutation({
  args: {
    id: v.id("posts"),
    status: v.union(
      v.literal("published"),
      v.literal("draft"),
      v.literal("archived"),
    ),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (!post) {
      throw new Error(`Post with ID ${args.id} not found`);
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

/**
 * Bulk update post status
 */
export const bulkUpdatePostStatus = mutation({
  args: {
    ids: v.array(v.id("posts")),
    status: v.union(
      v.literal("published"),
      v.literal("draft"),
      v.literal("archived"),
    ),
  },
  handler: async (ctx, args) => {
    const results = [];

    for (const id of args.ids) {
      const post = await ctx.db.get(id);
      if (post) {
        await ctx.db.patch(id, {
          status: args.status,
          updatedAt: Date.now(),
        });
        results.push(id);
      }
    }

    return results;
  },
});

const sanitizeSlug = (value: string | undefined) => {
  if (!value) return "";
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const ensureUniqueSlug = async (
  ctx: MutationCtx,
  baseSlug: string,
  organizationId: Id<"organizations"> | undefined,
  excludeId?: Id<"posts">,
) => {
  let attempt = baseSlug || `post-${Date.now()}`;
  let counter = 2;

  while (true) {
    const existing = organizationId
      ? await ctx.db
          .query("posts")
          .withIndex("by_organization_slug", (q) =>
            q.eq("organizationId", organizationId).eq("slug", attempt),
          )
          .first()
      : await ctx.db
          .query("posts")
          .withIndex("by_slug", (q) => q.eq("slug", attempt))
          .first();

    if (!existing || (excludeId && existing._id === excludeId)) {
      return attempt;
    }

    attempt = `${baseSlug}-${counter}`;
    counter += 1;
  }
};
