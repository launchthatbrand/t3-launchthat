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
    const requestedNumItems =
      typeof args.paginationOpts?.numItems === "number"
        ? args.paginationOpts.numItems
        : 60;
    const numItems = Math.max(1, Math.min(200, requestedNumItems));

    // Convex Components do not support `.paginate()`. We implement a lightweight cursor using `createdAt`.
    // `paginationOpts.cursor` is treated as an opaque string (we expect a numeric string timestamp).
    const cursorRaw = args.paginationOpts?.cursor;
    const cursorCreatedAt =
      typeof cursorRaw === "string" && cursorRaw.trim().length > 0
        ? Number(cursorRaw)
        : null;
    const hasValidCursor =
      typeof cursorCreatedAt === "number" && Number.isFinite(cursorCreatedAt);

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
      // Search index does not support cursor pagination in components today.
      const page = await ctx.db
        .query("vimeoVideos")
        .withSearchIndex("search_title", (q: any) =>
          q
            .search("title", search)
            .eq("connectionId", args.connectionId)
            .eq("status", "active"),
        )
        .take(numItems);
      return {
        page: page.map(normalizeRow),
        isDone: true,
        continueCursor: null,
      };
    }

    const rows = await ctx.db
      .query("vimeoVideos")
      .withIndex("by_connection_and_status_and_createdAt", (q: any) => {
        const base = q.eq("connectionId", args.connectionId).eq("status", "active");
        return hasValidCursor ? base.lt("createdAt", cursorCreatedAt) : base;
      })
      .order("desc")
      .take(numItems + 1);

    const hasMore = rows.length > numItems;
    const pageRows = rows.slice(0, numItems);
    const nextCursor = hasMore
      ? String(pageRows[pageRows.length - 1]?.createdAt ?? "")
      : null;
    return {
      page: pageRows.map(normalizeRow),
      isDone: !hasMore,
      continueCursor: nextCursor && nextCursor.length > 0 ? nextCursor : null,
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



