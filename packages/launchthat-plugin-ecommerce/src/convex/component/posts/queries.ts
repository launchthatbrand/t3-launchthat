import { v } from "convex/values";

import { query } from "../_generated/server";

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
            // Orders: ecommerce-specific lifecycle statuses (stored in post.status)
            v.literal("unpaid"),
            v.literal("paid"),
            v.literal("failed"),
          ),
        ),
        category: v.optional(v.string()),
        authorId: v.optional(v.string()),
        postTypeSlug: v.optional(v.string()),
        limit: v.optional(v.number()),
      }),
    ),
  },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
    const organizationId = args.organizationId ?? undefined;
    const postTypeSlug = args.filters?.postTypeSlug?.toLowerCase();
    const limit = args.filters?.limit ?? 50;

    let queryBuilder: any;
    if (organizationId) {
      queryBuilder = postTypeSlug
        ? ctx.db
            .query("posts")
            .withIndex("by_org_postTypeSlug", (q: any) =>
              q.eq("organizationId", organizationId).eq("postTypeSlug", postTypeSlug),
            )
        : ctx.db
            .query("posts")
            .withIndex("by_org", (q: any) => q.eq("organizationId", organizationId));
    } else if (postTypeSlug) {
      queryBuilder = ctx.db
        .query("posts")
        .withIndex("by_postTypeSlug", (q: any) => q.eq("postTypeSlug", postTypeSlug))
        .filter((q: any) => q.eq(q.field("organizationId"), undefined));
    } else {
      queryBuilder = ctx.db
        .query("posts")
        .filter((q: any) => q.eq(q.field("organizationId"), undefined));
    }

    if (args.filters?.status) {
      queryBuilder = queryBuilder.filter((q: any) =>
        q.eq(q.field("status"), args.filters?.status),
      );
    }
    if (args.filters?.category) {
      queryBuilder = queryBuilder.filter((q: any) =>
        q.eq(q.field("category"), args.filters?.category),
      );
    }
    if (args.filters?.authorId) {
      queryBuilder = queryBuilder.filter((q: any) =>
        q.eq(q.field("authorId"), args.filters?.authorId),
      );
    }

    const rows = await queryBuilder.order("desc").take(limit);
    return rows;
  },
});

export const getPostById = query({
  args: {
    id: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx: any, args: any) => {
    const post = await ctx.db.get(args.id as any);
    if (!post) return null;
    if (args.organizationId && post.organizationId !== args.organizationId) return null;
    return post;
  },
});

export const getPostBySlug = query({
  args: {
    slug: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx: any, args: any) => {
    const organizationId = args.organizationId ?? undefined;
    const slug = args.slug;
    const row = organizationId
      ? await ctx.db
          .query("posts")
          .withIndex("by_org_slug", (q: any) =>
            q.eq("organizationId", organizationId).eq("slug", slug),
          )
          .unique()
      : await ctx.db
          .query("posts")
          .withIndex("by_slug", (q: any) => q.eq("slug", slug))
          .filter((q: any) => q.eq(q.field("organizationId"), undefined))
          .unique();
    return row ?? null;
  },
});

export const getPostMeta = query({
  args: {
    postId: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
    // Optional org guard: verify the post belongs to org if provided.
    if (args.organizationId) {
      const post = await ctx.db.get(args.postId as any);
      if (!post || post.organizationId !== args.organizationId) {
        return [];
      }
    }

    const rows = await ctx.db
      .query("postsMeta")
      .withIndex("by_post", (q: any) => q.eq("postId", args.postId as any))
      .collect();
    return rows.map((row: any) => ({ key: row.key, value: row.value }));
  },
});

export const findFirstPostIdByMetaKeyValue = query({
  args: {
    key: v.string(),
    value: v.string(),
    organizationId: v.optional(v.string()),
    postTypeSlug: v.optional(v.string()),
  },
  returns: v.union(v.null(), v.string()),
  handler: async (ctx: any, args: any) => {
    const row = await ctx.db
      .query("postsMeta")
      .withIndex("by_key_and_value", (q: any) =>
        q.eq("key", args.key).eq("value", args.value),
      )
      .first();

    if (!row) return null;

    const post = await ctx.db.get(row.postId);
    if (!post) return null;

    if (args.organizationId && post.organizationId !== args.organizationId) {
      return null;
    }
    if (
      args.postTypeSlug &&
      String(post.postTypeSlug ?? "").toLowerCase() !==
        String(args.postTypeSlug ?? "").toLowerCase()
    ) {
      return null;
    }

    return String(post._id);
  },
});

export const listPostIdsByMetaKeyValue = query({
  args: {
    key: v.string(),
    value: v.string(),
    organizationId: v.optional(v.string()),
    postTypeSlug: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.string()),
  handler: async (ctx: any, args: any) => {
    const limit = args.limit ?? 50;
    const rows = await ctx.db
      .query("postsMeta")
      .withIndex("by_key_and_value", (q: any) =>
        q.eq("key", args.key).eq("value", args.value),
      )
      .take(200);

    const out: string[] = [];
    for (const row of rows) {
      if (out.length >= limit) break;
      const post = await ctx.db.get(row.postId);
      if (!post) continue;
      if (args.organizationId && post.organizationId !== args.organizationId) continue;
      if (
        args.postTypeSlug &&
        String(post.postTypeSlug ?? "").toLowerCase() !==
          String(args.postTypeSlug ?? "").toLowerCase()
      )
        continue;
      out.push(String(post._id));
    }

    return out;
  },
});

export const searchPosts = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
    organizationId: v.optional(v.string()),
    postTypeSlug: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
    const term = args.searchTerm.trim().toLowerCase();
    if (!term) return [];
    const limit = args.limit ?? 20;

    const rows = (await ctx.runQuery(getAllPosts as any, {
      organizationId: args.organizationId,
      filters: { postTypeSlug: args.postTypeSlug, limit: 200 },
    })) as any[];

    return rows
      .map((post) => {
        const haystack = `${post.title ?? ""}\n${post.excerpt ?? ""}\n${post.content ?? ""}`
          .toLowerCase()
          .trim();
        const score = haystack.includes(term) ? 1 : 0;
        return { post, score };
      })
      .filter((row) => row.score > 0)
      .slice(0, limit)
      .map((row) => row.post);
  },
});

export const getPostTags = query({
  args: {
    organizationId: v.optional(v.string()),
    postTypeSlug: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
    const rows = (await ctx.runQuery(getAllPosts as any, {
      organizationId: args.organizationId,
      filters: { postTypeSlug: args.postTypeSlug, limit: 500 },
    })) as any[];
    const tags = new Set<string>();
    rows.forEach((post) => {
      (post.tags ?? []).forEach((tag: string) => tags.add(tag));
    });
    return Array.from(tags);
  },
});

export const getPostCategories = query({
  args: {
    organizationId: v.optional(v.string()),
    postTypeSlug: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
    const rows = (await ctx.runQuery(getAllPosts as any, {
      organizationId: args.organizationId,
      filters: { postTypeSlug: args.postTypeSlug, limit: 500 },
    })) as any[];
    const categories = new Set<string>();
    rows.forEach((post) => {
      if (typeof post.category === "string" && post.category.trim()) {
        categories.add(post.category.trim());
      }
    });
    return Array.from(categories);
  },
});

