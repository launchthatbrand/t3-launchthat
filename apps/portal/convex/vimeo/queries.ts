/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { query } from "../_generated/server";

const queryAny = query as any;

export const listVideos = queryAny({
  args: {
    organizationId: v.id("organizations"),
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("vimeoVideos"),
        videoId: v.string(),
        title: v.string(),
        description: v.optional(v.string()),
        embedUrl: v.string(),
        thumbnailUrl: v.optional(v.string()),
        publishedAt: v.number(),
      }),
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  // NOTE: We intentionally cast ctx/args to any to avoid TS "type instantiation is excessively deep"
  // in large Convex schemas, while still enforcing runtime validation via `args`/`returns`.
  handler: async (ctx: any, args: any) => {
    const connection = await ctx.db
      .query("connections")
      .withIndex("by_node_type_and_owner", (q: any) =>
        q.eq("nodeType", "vimeo").eq("ownerId", args.organizationId),
      )
      .unique();

    if (!connection) {
      return { page: [], isDone: true, continueCursor: null };
    }

    const search = args.search?.trim() ?? "";
    const isActive = (row: any) => (row.status ?? "active") === "active";

    const normalizeRow = (row: any) => ({
      _id: row._id,
      videoId: row.videoId,
      title: row.title,
      description: row.description ?? undefined,
      embedUrl: row.embedUrl,
      thumbnailUrl: row.thumbnailUrl ?? undefined,
      publishedAt: row.publishedAt,
    });

    if (search.length > 0) {
      const result = await ctx.db
        .query("vimeoVideos")
        .withSearchIndex("search_title", (q: any) =>
          q.search("title", search).eq("connectionId", connection._id),
        )
        .paginate(args.paginationOpts);
      return {
        page: result.page.filter(isActive).map(normalizeRow),
        isDone: result.isDone,
        continueCursor: result.continueCursor,
      };
    }

    const result = await ctx.db
      .query("vimeoVideos")
      .withIndex("by_connection", (q: any) => q.eq("connectionId", connection._id))
      .order("desc")
      .paginate(args.paginationOpts);
    return {
      page: result.page.filter(isActive).map(normalizeRow),
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const getVideoByExternalId = queryAny({
  args: { connectionId: v.id("connections"), videoId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("vimeoVideos"),
      videoId: v.string(),
      title: v.string(),
      embedUrl: v.string(),
      thumbnailUrl: v.optional(v.string()),
      publishedAt: v.number(),
      connectionId: v.id("connections"),
    }),
  ),
  handler: async (ctx: any, args: any) => {
    const existing = await ctx.db
      .query("vimeoVideos")
      .withIndex("by_connection_and_videoId", (q: any) =>
        q.eq("connectionId", args.connectionId).eq("videoId", args.videoId),
      )
      .unique();
    if (!existing) return null;
    return {
      _id: existing._id,
      videoId: existing.videoId,
      title: existing.title,
      embedUrl: existing.embedUrl,
      thumbnailUrl: existing.thumbnailUrl ?? undefined,
      publishedAt: existing.publishedAt,
      connectionId: existing.connectionId,
    };
  },
});
