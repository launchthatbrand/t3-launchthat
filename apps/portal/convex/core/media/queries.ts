import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { query } from "../../_generated/server";

/**
 * Get media item with URL by mediaItems ID
 */
export const getMediaItem = query({
  args: { id: v.id("mediaItems") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("mediaItems"),
      _creationTime: v.number(),
      storageId: v.optional(v.id("_storage")),
      externalUrl: v.optional(v.string()),
      url: v.optional(v.string()),
      title: v.optional(v.string()),
      caption: v.optional(v.string()),
      alt: v.optional(v.string()),
      categoryIds: v.optional(v.array(v.id("categories"))), // Changed from categories array
      categories: v.optional(v.array(v.string())), // Keep for backward compatibility
      status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    }),
  ),
  handler: async (ctx, args) => {
    const mediaItem = await ctx.db.get(args.id);
    if (!mediaItem) {
      return null;
    }

    // Get URL for storage items
    let url: string | undefined;
    if (mediaItem.storageId) {
      url = (await ctx.storage.getUrl(mediaItem.storageId)) ?? undefined;
    } else if (mediaItem.externalUrl) {
      url = mediaItem.externalUrl;
    }

    return {
      ...mediaItem,
      url,
      // Map legacy categories field if it exists
      categoryIds: mediaItem.categoryIds ?? [],
    };
  },
});

/**
 * Get media by storage ID
 */
export const getMediaByStorageId = query({
  args: { storageId: v.id("_storage") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("mediaItems"),
      _creationTime: v.number(),
      storageId: v.optional(v.id("_storage")),
      externalUrl: v.optional(v.string()),
      url: v.optional(v.string()),
      title: v.optional(v.string()),
      caption: v.optional(v.string()),
      alt: v.optional(v.string()),
      categoryIds: v.optional(v.array(v.id("categories"))),
      categories: v.optional(v.array(v.string())),
      status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    }),
  ),
  handler: async (ctx, args) => {
    const mediaItem = await ctx.db
      .query("mediaItems")
      .withIndex("by_storage", (q) => q.eq("storageId", args.storageId))
      .first();

    if (!mediaItem) {
      return null;
    }

    const url = (await ctx.storage.getUrl(args.storageId)) ?? undefined;

    return {
      ...mediaItem,
      url,
      categoryIds: mediaItem.categoryIds ?? [],
    };
  },
});

/**
 * Get media by ID
 */
export const getMediaById = query({
  args: { id: v.id("mediaItems") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("mediaItems"),
      _creationTime: v.number(),
      storageId: v.optional(v.id("_storage")),
      externalUrl: v.optional(v.string()),
      url: v.optional(v.string()),
      title: v.optional(v.string()),
      caption: v.optional(v.string()),
      alt: v.optional(v.string()),
      categoryIds: v.optional(v.array(v.id("categories"))),
      categories: v.optional(v.array(v.string())),
      status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    }),
  ),
  handler: async (ctx, args) => {
    const mediaItem = await ctx.db.get(args.id);
    if (!mediaItem) return null;

    let url: string | undefined;
    if (mediaItem.storageId) {
      url = (await ctx.storage.getUrl(mediaItem.storageId)) ?? undefined;
    } else if (mediaItem.externalUrl) {
      url = mediaItem.externalUrl;
    }

    return {
      ...mediaItem,
      url,
      categoryIds: mediaItem.categoryIds ?? [],
    };
  },
});

/**
 * List media items with optional filtering and pagination
 */
export const listMediaItemsWithUrl = query({
  args: {
    paginationOpts: paginationOptsValidator,
    categoryIds: v.optional(v.array(v.id("categories"))), // Changed from categoryId
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    searchTerm: v.optional(v.string()),
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("mediaItems"),
        _creationTime: v.number(),
        storageId: v.optional(v.id("_storage")),
        externalUrl: v.optional(v.string()),
        url: v.optional(v.string()),
        title: v.optional(v.string()),
        caption: v.optional(v.string()),
        alt: v.optional(v.string()),
        categoryIds: v.optional(v.array(v.id("categories"))),
        categories: v.optional(v.array(v.string())),
        status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
      }),
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
    pageStatus: v.optional(v.union(v.string(), v.null())),
    splitCursor: v.optional(v.union(v.string(), v.null())),
  }),
  handler: async (ctx, args) => {
    const base = ctx.db.query("mediaItems");
    const indexed = args.status
      ? base.withIndex("by_status", (qi) => qi.eq("status", args.status))
      : base;

    const result = await indexed.paginate(args.paginationOpts);

    // Post-filtering by categoryIds and search term on the current page only
    let page = result.page;
    if (args.categoryIds && args.categoryIds.length > 0) {
      page = page.filter((item) =>
        (item.categoryIds ?? []).some((c) => args.categoryIds?.includes(c)),
      );
    }
    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      page = page.filter((item) => {
        const t = item.title?.toLowerCase() ?? "";
        const a = item.alt?.toLowerCase() ?? "";
        const c = item.caption?.toLowerCase() ?? "";
        return t.includes(term) || a.includes(term) || c.includes(term);
      });
    }

    const enriched = await Promise.all(
      page.map(async (item) => {
        let url: string | undefined;
        if (item.storageId) {
          url = (await ctx.storage.getUrl(item.storageId)) ?? undefined;
        } else if (item.externalUrl) {
          url = item.externalUrl;
        }
        return { ...item, url };
      }),
    );

    return { ...result, page: enriched };
  },
});

/**
 * List media items (legacy function name - keeping for compatibility)
 */
export const listMedia = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("mediaItems"),
        _creationTime: v.number(),
        storageId: v.optional(v.id("_storage")),
        externalUrl: v.optional(v.string()),
        url: v.optional(v.string()),
        title: v.optional(v.string()),
        caption: v.optional(v.string()),
        alt: v.optional(v.string()),
        categoryIds: v.optional(v.array(v.id("categories"))),
        categories: v.optional(v.array(v.string())),
        status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
      }),
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("mediaItems")
      .withIndex("by_uploaded_at")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

/**
 * Legacy function for backward compatibility
 */
export const listImages = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("mediaItems"),
        _creationTime: v.number(),
        storageId: v.optional(v.id("_storage")),
        externalUrl: v.optional(v.string()),
        url: v.optional(v.string()),
        title: v.optional(v.string()),
        caption: v.optional(v.string()),
        alt: v.optional(v.string()),
        categoryIds: v.optional(v.array(v.id("categories"))),
        categories: v.optional(v.array(v.string())),
        status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
      }),
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const q = ctx.db
      .query("mediaItems")
      .withIndex("by_status", (qi) => qi.eq("status", "published"));
    return await q.paginate(args.paginationOpts);
  },
});

/**
 * Search media items
 */
export const searchMedia = query({
  args: {
    searchTerm: v.string(),
    categoryIds: v.optional(v.array(v.id("categories"))),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("mediaItems"),
      _creationTime: v.number(),
      storageId: v.optional(v.id("_storage")),
      externalUrl: v.optional(v.string()),
      url: v.optional(v.string()),
      title: v.optional(v.string()),
      caption: v.optional(v.string()),
      alt: v.optional(v.string()),
      categoryIds: v.optional(v.array(v.id("categories"))),
      categories: v.optional(v.array(v.string())),
      status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    }),
  ),
  handler: async (ctx, args) => {
    const results: {
      _id: Id<"mediaItems">;
      _creationTime: number;
      storageId?: Id<"_storage">;
      externalUrl?: string;
      url?: string;
      title?: string;
      caption?: string;
      alt?: string;
      categoryIds?: Id<"categories">[];
      categories?: string[];
      status?: "draft" | "published";
    }[] = [];

    // Title search
    const titleQ = ctx.db
      .query("mediaItems")
      .withSearchIndex("search_title", (q) =>
        q.search("title", args.searchTerm),
      );
    const titlePage = await titleQ.take(args.limit ?? 25);
    results.push(...titlePage);

    // Caption search
    const captionQ = ctx.db
      .query("mediaItems")
      .withSearchIndex("search_caption", (q) =>
        q.search("caption", args.searchTerm),
      );
    const captionPage = await captionQ.take(args.limit ?? 25);
    results.push(...captionPage);

    // Alt search
    const altQ = ctx.db
      .query("mediaItems")
      .withSearchIndex("search_alt", (q) => q.search("alt", args.searchTerm));
    const altPage = await altQ.take(args.limit ?? 25);
    results.push(...altPage);

    // Deduplicate by _id
    const seen = new Set<string>();
    const deduped = results.filter((item) => {
      const id = item._id as unknown as string;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    // Apply status filter if provided
    const filteredByStatus = args.status
      ? deduped.filter((i) => i.status === args.status)
      : deduped;

    // Apply categoryIds filter if provided
    let filtered = filteredByStatus;
    if (args.categoryIds && args.categoryIds.length > 0) {
      filtered = filteredByStatus.filter((i) => {
        const ids = i.categoryIds ?? [];
        return ids.some(
          (c) =>
            (args.categoryIds as Id<"categories">[] | undefined)?.includes(
              c,
            ) === true,
        );
      });
    }

    // Attach URL
    const withUrls = await Promise.all(
      filtered.map(async (item) => {
        let url: string | undefined;
        if (item.storageId) {
          url = (await ctx.storage.getUrl(item.storageId)) ?? undefined;
        } else if (item.externalUrl) {
          url = item.externalUrl;
        }
        return { ...item, url };
      }),
    );

    return withUrls.slice(0, args.limit ?? 25);
  },
});
