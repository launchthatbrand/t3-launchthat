import { v } from "convex/values";

import { query } from "./_generated/server";
import { organizationMatches } from "./helpers";

export const listSupportPosts = query({
  args: {
    organizationId: v.string(),
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
        parentId: v.optional(v.id("posts")),
        limit: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const orgId = args.organizationId;
    const postTypeSlug = args.filters?.postTypeSlug?.toLowerCase();
    const parentId = args.filters?.parentId;

    let qb;
    if (parentId) {
      qb = ctx.db
        .query("posts")
        .withIndex("by_org_parent", (q) =>
          q.eq("organizationId", orgId).eq("parentId", parentId),
        );
    } else if (postTypeSlug) {
      qb = ctx.db
        .query("posts")
        .withIndex("by_org_postTypeSlug", (q) =>
          q.eq("organizationId", orgId).eq("postTypeSlug", postTypeSlug),
        );
    } else {
      qb = ctx.db
        .query("posts")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId));
    }

    if (args.filters?.status) {
      qb = qb.filter((q) => q.eq(q.field("status"), args.filters?.status));
    }

    const posts = await qb.order("desc").take(args.filters?.limit ?? 200);
    return posts;
  },
});

export const getSupportPostById = query({
  args: {
    id: v.id("posts"),
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (!post) return null;
    if (
      !organizationMatches(
        post.organizationId ?? undefined,
        args.organizationId ?? undefined,
      )
    ) {
      return null;
    }
    return post;
  },
});

export const getSupportPostMeta = query({
  args: {
    postId: v.id("posts"),
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return [];
    if (
      !organizationMatches(
        post.organizationId ?? undefined,
        args.organizationId ?? undefined,
      )
    ) {
      return [];
    }

    return await ctx.db
      .query("postsMeta")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
  },
});

export const getSupportOption = query({
  args: {
    organizationId: v.string(),
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("options")
      .withIndex("by_org_key", (q) =>
        q.eq("organizationId", args.organizationId).eq("key", args.key),
      )
      .unique();
    if (!existing) return null;
    return {
      key: existing.key,
      value: existing.value ?? null,
      updatedAt: existing.updatedAt ?? existing.createdAt,
    };
  },
});

export const listSupportOptions = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const options = await ctx.db
      .query("options")
      .withIndex("by_org_key", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    return options.map((opt) => ({
      key: opt.key,
      value: opt.value ?? null,
      updatedAt: opt.updatedAt ?? opt.createdAt,
    }));
  },
});
