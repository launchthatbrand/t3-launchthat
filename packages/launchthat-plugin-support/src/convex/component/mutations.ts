import { mutation } from "./_generated/server";
import { organizationMatches } from "./helpers";
import { v } from "convex/values";

export const createSupportPost = mutation({
  args: {
    title: v.string(),
    organizationId: v.string(),
    postTypeSlug: v.string(),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    slug: v.string(),
    status: v.union(
      v.literal("published"),
      v.literal("draft"),
      v.literal("archived"),
    ),
    tags: v.optional(v.array(v.string())),
    authorId: v.optional(v.string()),
    parentId: v.optional(v.id("posts")),
    parentTypeSlug: v.optional(v.string()),
    meta: v.optional(
      v.array(
        v.object({
          key: v.string(),
          value: v.optional(
            v.union(v.string(), v.number(), v.boolean(), v.null()),
          ),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    const postId = await ctx.db.insert("posts", {
      title: args.title,
      organizationId: args.organizationId,
      postTypeSlug: args.postTypeSlug.toLowerCase(),
      content: args.content,
      excerpt: args.excerpt,
      slug: args.slug.toLowerCase(),
      status: args.status,
      tags: args.tags,
      authorId: args.authorId,
      parentId: args.parentId,
      parentTypeSlug: args.parentTypeSlug,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    if (args.meta && args.meta.length > 0) {
      for (const entry of args.meta) {
        await ctx.db.insert("postsMeta", {
          postId,
          key: entry.key,
          value: entry.value ?? null,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
    }

    return postId;
  },
});

export const updateSupportPost = mutation({
  args: {
    id: v.id("posts"),
    organizationId: v.string(),
    title: v.string(),
    postTypeSlug: v.string(),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    slug: v.string(),
    status: v.union(
      v.literal("published"),
      v.literal("draft"),
      v.literal("archived"),
    ),
    tags: v.optional(v.array(v.string())),
    authorId: v.optional(v.string()),
    parentId: v.optional(v.id("posts")),
    parentTypeSlug: v.optional(v.string()),
    meta: v.optional(
      v.array(
        v.object({
          key: v.string(),
          value: v.optional(
            v.union(v.string(), v.number(), v.boolean(), v.null()),
          ),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) return null;
    if (
      !organizationMatches(
        existing.organizationId ?? undefined,
        args.organizationId,
      )
    ) {
      return null;
    }

    const timestamp = Date.now();
    await ctx.db.patch(args.id, {
      title: args.title,
      postTypeSlug: args.postTypeSlug.toLowerCase(),
      content: args.content,
      excerpt: args.excerpt,
      slug: args.slug.toLowerCase(),
      status: args.status,
      tags: args.tags,
      authorId: args.authorId,
      parentId: args.parentId,
      parentTypeSlug: args.parentTypeSlug,
      updatedAt: timestamp,
    });

    if (args.meta) {
      for (const entry of args.meta) {
        const existingMeta = await ctx.db
          .query("postsMeta")
          .withIndex("by_post_and_key", (q) =>
            q.eq("postId", args.id).eq("key", entry.key),
          )
          .unique();
        if (existingMeta) {
          await ctx.db.patch(existingMeta._id, {
            value: entry.value ?? null,
            updatedAt: timestamp,
          });
        } else {
          await ctx.db.insert("postsMeta", {
            postId: args.id,
            key: entry.key,
            value: entry.value ?? null,
            createdAt: timestamp,
            updatedAt: timestamp,
          });
        }
      }
    }

    return args.id;
  },
});

export const upsertSupportPostMeta = mutation({
  args: {
    postId: v.id("posts"),
    organizationId: v.string(),
    entries: v.array(
      v.object({
        key: v.string(),
        value: v.optional(
          v.union(v.string(), v.number(), v.boolean(), v.null()),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return false;
    if (
      !organizationMatches(
        post.organizationId ?? undefined,
        args.organizationId,
      )
    ) {
      return false;
    }
    const timestamp = Date.now();
    for (const entry of args.entries) {
      const existing = await ctx.db
        .query("postsMeta")
        .withIndex("by_post_and_key", (q) =>
          q.eq("postId", args.postId).eq("key", entry.key),
        )
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, {
          value: entry.value ?? null,
          updatedAt: timestamp,
        });
      } else {
        await ctx.db.insert("postsMeta", {
          postId: args.postId,
          key: entry.key,
          value: entry.value ?? null,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
    }
    return true;
  },
});

export const upsertSupportOption = mutation({
  args: {
    organizationId: v.string(),
    key: v.string(),
    value: v.optional(
      v.union(v.string(), v.number(), v.boolean(), v.null()),
    ),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    const existing = await ctx.db
      .query("options")
      .withIndex("by_org_key", (q) =>
        q.eq("organizationId", args.organizationId).eq("key", args.key),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value ?? null,
        updatedAt: timestamp,
      });
      return existing._id;
    }
    const id = await ctx.db.insert("options", {
      organizationId: args.organizationId,
      key: args.key,
      value: args.value ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    return id;
  },
});

export const mutations = {
  createSupportPost,
  updateSupportPost,
  upsertSupportPostMeta,
  upsertSupportOption,
};


