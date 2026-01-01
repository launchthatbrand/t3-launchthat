import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { mutation } from "../_generated/server";
import { ensureUniqueSlug, sanitizeSlug } from "./helpers";

const metaValueValidator = v.union(
  v.string(),
  v.number(),
  v.boolean(),
  v.null(),
);
const metaRecordValidator = v.record(v.string(), metaValueValidator);

const upsertMetaEntries = async (
  ctx: any,
  postId: Id<"posts">,
  meta: Record<string, unknown>,
) => {
  const now = Date.now();
  for (const [key, rawValue] of Object.entries(meta)) {
    // Only allow our supported primitives; coerce everything else to null.
    const value =
      typeof rawValue === "string" ||
      typeof rawValue === "number" ||
      typeof rawValue === "boolean" ||
      rawValue === null
        ? rawValue
        : null;

    const existing = await ctx.db
      .query("postsMeta")
      .withIndex("by_post_and_key", (q: any) =>
        q.eq("postId", postId).eq("key", key),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { value, updatedAt: now });
    } else {
      await ctx.db.insert("postsMeta", {
        postId,
        key,
        value,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
};

export const createPost = mutation({
  args: {
    organizationId: v.optional(v.string()),
    postTypeSlug: v.string(),
    title: v.string(),
    slug: v.string(),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    status: v.union(
      v.literal("published"),
      v.literal("draft"),
      v.literal("archived"),
      // Orders: ecommerce-specific lifecycle statuses (stored in post.status)
      v.literal("unpaid"),
      v.literal("paid"),
      v.literal("failed"),
    ),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    featuredImage: v.optional(v.string()),
    featuredImageUrl: v.optional(v.string()),
    meta: v.optional(metaRecordValidator),
    authorId: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
    const organizationId = args.organizationId ?? undefined;
    const postTypeSlug = args.postTypeSlug.toLowerCase();
    const normalizedSlug =
      sanitizeSlug(args.slug) || `${postTypeSlug}-${Date.now()}`;
    const uniqueSlug = await ensureUniqueSlug(
      ctx as any,
      normalizedSlug,
      organizationId,
    );

    const now = Date.now();
    const createdAt = args.createdAt ?? now;

    const postId = await ctx.db.insert("posts", {
      title: args.title,
      content: args.content,
      excerpt: args.excerpt,
      slug: uniqueSlug,
      status: args.status,
      category: args.category,
      tags: args.tags,
      featuredImageUrl: args.featuredImage ?? args.featuredImageUrl,
      postTypeSlug,
      organizationId,
      authorId: args.authorId,
      createdAt,
      updatedAt: args.updatedAt,
    });

    const metaToWrite: Record<string, unknown> =
      args.meta && typeof args.meta === "object" ? { ...(args.meta as any) } : {};

    // Enforce: default checkout must not have predefined products.
    if (postTypeSlug === "checkout" && uniqueSlug === "__default_checkout__") {
      metaToWrite["checkout.predefinedProductsJson"] = "[]";
    }

    if (Object.keys(metaToWrite).length > 0) {
      await upsertMetaEntries(
        ctx,
        postId as Id<"posts">,
        metaToWrite,
      );
    }

    return String(postId);
  },
});

export const updatePost = mutation({
  args: {
    id: v.string(),
    organizationId: v.optional(v.string()),
    // Backwards compat: legacy callers may still send `patch`.
    patch: v.optional(v.any()),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    slug: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("published"),
        v.literal("draft"),
        v.literal("archived"),
        // Orders: ecommerce-specific lifecycle statuses (stored in post.status)
        v.literal("unpaid"),
        v.literal("paid"),
        v.literal("failed"),
      ),
    ),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    featuredImage: v.optional(v.string()),
    featuredImageUrl: v.optional(v.string()),
    meta: v.optional(metaRecordValidator),
  },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
    const post = await ctx.db.get(args.id as any);
    if (!post) {
      throw new Error(`Post not found: ${args.id}`);
    }
    if (args.organizationId && post.organizationId !== args.organizationId) {
      throw new Error("Post not found for organization");
    }

    const basePatch = (args.patch ?? {}) as Record<string, unknown>;
    const updates: Record<string, unknown> = { ...basePatch };

    // Generic component-posts API shape: explicit fields on args override `patch`.
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    if (args.excerpt !== undefined) updates.excerpt = args.excerpt;
    if (args.status !== undefined) updates.status = args.status;
    if (args.category !== undefined) updates.category = args.category;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.featuredImage !== undefined)
      updates.featuredImage = args.featuredImage;
    if (args.featuredImageUrl !== undefined)
      updates.featuredImageUrl = args.featuredImageUrl;
    if (args.slug !== undefined) updates.slug = args.slug;

    if (typeof updates.featuredImage === "string") {
      updates.featuredImageUrl = updates.featuredImage;
      delete updates.featuredImage;
    }

    if (typeof updates.slug === "string") {
      const sanitized = sanitizeSlug(updates.slug);
      const normalized =
        sanitized.length > 0 ? sanitized : (post.slug ?? `post-${Date.now()}`);
      if (normalized !== post.slug) {
        updates.slug = await ensureUniqueSlug(
          ctx as any,
          normalized,
          post.organizationId ?? undefined,
          String(post._id),
        );
      }
    }

    if (updates.postTypeSlug && typeof updates.postTypeSlug === "string") {
      updates.postTypeSlug = updates.postTypeSlug.toLowerCase();
    }

    if (updates.updatedAt === undefined) {
      updates.updatedAt = Date.now();
    }

    // Meta is stored in postsMeta, not on the post record.
    // Accept both args.meta and patch.meta (back-compat).
    const metaFromArgs = args.meta as Record<string, unknown> | undefined;
    const metaFromPatch =
      basePatch.meta && typeof basePatch.meta === "object"
        ? (basePatch.meta as Record<string, unknown>)
        : undefined;
    const meta = metaFromArgs ?? metaFromPatch;
    delete updates.meta;

    await ctx.db.patch(post._id, updates as any);

    if (meta && Object.keys(meta).length > 0) {
      const metaToWrite: Record<string, unknown> = { ...meta };
      // Enforce: default checkout must not have predefined products.
      if (post.postTypeSlug === "checkout" && post.slug === "__default_checkout__") {
        metaToWrite["checkout.predefinedProductsJson"] = "[]";
      }
      await upsertMetaEntries(ctx, post._id as Id<"posts">, metaToWrite);
    }
    return { success: true };
  },
});

export const deletePost = mutation({
  args: {
    id: v.string(),
  },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
    const post = await ctx.db.get(args.id as any);
    if (!post) return { success: true };

    await ctx.db.delete(post._id);
    const metaEntries = await ctx.db
      .query("postsMeta")
      .withIndex("by_post", (q: any) => q.eq("postId", post._id))
      .collect();
    await Promise.all(
      metaEntries.map((entry: any) => ctx.db.delete(entry._id)),
    );
    return { success: true };
  },
});

export const setPostMeta = mutation({
  args: {
    postId: v.string(),
    key: v.string(),
    value: v.optional(metaValueValidator),
  },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
    const post = await ctx.db.get(args.postId as any);
    if (!post) {
      throw new Error(`Post not found: ${args.postId}`);
    }

    const existing = await ctx.db
      .query("postsMeta")
      .withIndex("by_post_and_key", (q: any) =>
        q.eq("postId", post._id).eq("key", args.key),
      )
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value ?? null,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("postsMeta", {
        postId: post._id,
        key: args.key,
        value: args.value ?? null,
        createdAt: now,
      });
    }

    return { success: true };
  },
});
