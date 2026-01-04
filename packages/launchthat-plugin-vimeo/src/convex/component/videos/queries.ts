/* eslint-disable @typescript-eslint/no-explicit-any */
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { query } from "../_generated/server";

const queryAny = query as any;

export const listVideosByConnectionPaginated = queryAny({
  args: {
    connectionId: v.string(),
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
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
          q.search("title", search).eq("connectionId", args.connectionId),
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
      .withIndex("by_connection", (q: any) =>
        q.eq("connectionId", args.connectionId),
      )
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
  args: { connectionId: v.string(), videoId: v.string() },
  returns: v.any(),
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



