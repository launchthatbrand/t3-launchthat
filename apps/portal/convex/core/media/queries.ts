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
      organizationId: v.optional(v.id("organizations")),
      storageId: v.optional(v.id("_storage")),
      previewImageStorageId: v.optional(v.id("_storage")),
      previewGeneratedAt: v.optional(v.number()),
      externalUrl: v.optional(v.string()),
      url: v.optional(v.string()),
      previewImageUrl: v.optional(v.string()),
      title: v.optional(v.string()),
      caption: v.optional(v.string()),
      alt: v.optional(v.string()),
      taxonomyTermIds: v.optional(v.array(v.id("taxonomyTerms"))),
      categories: v.optional(v.array(v.string())), // Keep for backward compatibility
      status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
      mimeType: v.optional(v.string()),
      width: v.optional(v.number()),
      height: v.optional(v.number()),
      uploadedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const mediaItem = await ctx.db.get(args.id);
    if (!mediaItem) {
      return null;
    }

    // Get URL for storage items
    let url: string | undefined;
    let previewImageUrl: string | undefined;
    let mimeType: string | undefined;
    if (mediaItem.storageId) {
      url = (await ctx.storage.getUrl(mediaItem.storageId)) ?? undefined;
      const storageId = mediaItem.storageId as unknown as string;
      const looksLikeConvexId = /^[a-z0-9]{32}$/.test(storageId);
      if (looksLikeConvexId) {
        try {
          const storageMeta = await ctx.db.system.get(
            "_storage",
            mediaItem.storageId,
          );
          if (storageMeta && typeof (storageMeta as any).contentType === "string") {
            mimeType = (storageMeta as any).contentType as string;
          }
        } catch {
          // Legacy/invalid storageId formats exist in some deployments; ignore.
        }
      }
    } else if (mediaItem.externalUrl) {
      url = mediaItem.externalUrl;
    }

    if (mediaItem.previewImageStorageId) {
      previewImageUrl =
        (await ctx.storage.getUrl(mediaItem.previewImageStorageId)) ?? undefined;
    }

    return {
      ...mediaItem,
      url,
      previewImageUrl,
      mimeType: mediaItem.mimeType ?? mimeType,
      // Map legacy categories field if it exists
      taxonomyTermIds: mediaItem.taxonomyTermIds ?? [],
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
      organizationId: v.optional(v.id("organizations")),
      storageId: v.optional(v.id("_storage")),
      previewImageStorageId: v.optional(v.id("_storage")),
      previewGeneratedAt: v.optional(v.number()),
      externalUrl: v.optional(v.string()),
      url: v.optional(v.string()),
      previewImageUrl: v.optional(v.string()),
      title: v.optional(v.string()),
      caption: v.optional(v.string()),
      alt: v.optional(v.string()),
      taxonomyTermIds: v.optional(v.array(v.id("taxonomyTerms"))),
      categories: v.optional(v.array(v.string())),
      status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
      mimeType: v.optional(v.string()),
      width: v.optional(v.number()),
      height: v.optional(v.number()),
      uploadedAt: v.optional(v.number()),
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
    let mimeType: string | undefined;
    let previewImageUrl: string | undefined;
    try {
      const storageMeta = await ctx.db.system.get("_storage", args.storageId);
      if (storageMeta && typeof (storageMeta as any).contentType === "string") {
        mimeType = (storageMeta as any).contentType as string;
      }
    } catch {
      // ignore
    }

    if (mediaItem.previewImageStorageId) {
      previewImageUrl =
        (await ctx.storage.getUrl(mediaItem.previewImageStorageId)) ?? undefined;
    }

    return {
      ...mediaItem,
      url,
      previewImageUrl,
      mimeType: mediaItem.mimeType ?? mimeType,
      taxonomyTermIds: mediaItem.taxonomyTermIds ?? [],
    };
  },
});

/**
 * Debug helper: fetch Convex _storage metadata for a file.
 * Useful for diagnosing cases where a storageId exists but reads return empty bytes.
 */
export const getStorageMetadata = query({
  args: { storageId: v.id("_storage") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.system.get("_storage", args.storageId);
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
      organizationId: v.optional(v.id("organizations")),
      storageId: v.optional(v.id("_storage")),
      previewImageStorageId: v.optional(v.id("_storage")),
      previewGeneratedAt: v.optional(v.number()),
      externalUrl: v.optional(v.string()),
      url: v.optional(v.string()),
      previewImageUrl: v.optional(v.string()),
      title: v.optional(v.string()),
      caption: v.optional(v.string()),
      alt: v.optional(v.string()),
      taxonomyTermIds: v.optional(v.array(v.id("taxonomyTerms"))),
      categories: v.optional(v.array(v.string())),
      status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
      mimeType: v.optional(v.string()),
      width: v.optional(v.number()),
      height: v.optional(v.number()),
      uploadedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const mediaItem = await ctx.db.get(args.id);
    if (!mediaItem) return null;

    let url: string | undefined;
    let previewImageUrl: string | undefined;
    let mimeType: string | undefined;
    if (mediaItem.storageId) {
      url = (await ctx.storage.getUrl(mediaItem.storageId)) ?? undefined;
      const storageId = mediaItem.storageId as unknown as string;
      const looksLikeConvexId = /^[a-z0-9]{32}$/.test(storageId);
      if (looksLikeConvexId) {
        try {
          const storageMeta = await ctx.db.system.get(
            "_storage",
            mediaItem.storageId,
          );
          if (storageMeta && typeof (storageMeta as any).contentType === "string") {
            mimeType = (storageMeta as any).contentType as string;
          }
        } catch {
          // ignore
        }
      }
    } else if (mediaItem.externalUrl) {
      url = mediaItem.externalUrl;
    }

    if (mediaItem.previewImageStorageId) {
      previewImageUrl =
        (await ctx.storage.getUrl(mediaItem.previewImageStorageId)) ?? undefined;
    }

    return {
      ...mediaItem,
      url,
      previewImageUrl,
      mimeType: mediaItem.mimeType ?? mimeType,
      taxonomyTermIds: mediaItem.taxonomyTermIds ?? [],
    };
  },
});

/**
 * List media items with optional filtering and pagination
 */
export const listMediaItemsWithUrl = query({
  args: {
    paginationOpts: paginationOptsValidator,
    organizationId: v.optional(v.id("organizations")),
    taxonomyTermIds: v.optional(v.array(v.id("taxonomyTerms"))),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    searchTerm: v.optional(v.string()),
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("mediaItems"),
        _creationTime: v.number(),
        organizationId: v.optional(v.id("organizations")),
        storageId: v.optional(v.id("_storage")),
        previewImageStorageId: v.optional(v.id("_storage")),
        previewGeneratedAt: v.optional(v.number()),
        externalUrl: v.optional(v.string()),
        url: v.optional(v.string()),
        previewImageUrl: v.optional(v.string()),
        title: v.optional(v.string()),
        caption: v.optional(v.string()),
        alt: v.optional(v.string()),
        taxonomyTermIds: v.optional(v.array(v.id("taxonomyTerms"))),
        categories: v.optional(v.array(v.string())),
        status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
        mimeType: v.optional(v.string()),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        uploadedAt: v.optional(v.number()),
      }),
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
    pageStatus: v.optional(v.union(v.string(), v.null())),
    splitCursor: v.optional(v.union(v.string(), v.null())),
  }),
  handler: async (ctx, args) => {
    const base = ctx.db.query("mediaItems");
    const indexed =
      args.organizationId && args.status
        ? base
            .withIndex("by_organization_and_status_and_uploadedAt", (qi) =>
              qi
                .eq("organizationId", args.organizationId)
                .eq("status", args.status),
            )
            .order("desc")
        : args.organizationId
          ? base
              .withIndex("by_organization_and_uploadedAt", (qi) =>
                qi.eq("organizationId", args.organizationId),
              )
              .order("desc")
          : args.status
            ? base.withIndex("by_status", (qi) => qi.eq("status", args.status))
            : base;

    const result = await indexed.paginate(args.paginationOpts);

    // Post-filtering by categoryIds and search term on the current page only
    let page = result.page;
    if (args.taxonomyTermIds && args.taxonomyTermIds.length > 0) {
      page = page.filter((item) =>
        (item.taxonomyTermIds ?? []).some((c) =>
          args.taxonomyTermIds?.includes(c),
        ),
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
        let previewImageUrl: string | undefined;
        if (item.storageId) {
          url = (await ctx.storage.getUrl(item.storageId)) ?? undefined;
        } else if (item.externalUrl) {
          url = item.externalUrl;
        }
        if (item.previewImageStorageId) {
          previewImageUrl =
            (await ctx.storage.getUrl(item.previewImageStorageId)) ?? undefined;
        }
        return { ...item, url, previewImageUrl };
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
        organizationId: v.optional(v.id("organizations")),
        storageId: v.optional(v.id("_storage")),
        previewImageStorageId: v.optional(v.id("_storage")),
        previewGeneratedAt: v.optional(v.number()),
        externalUrl: v.optional(v.string()),
        url: v.optional(v.string()),
        previewImageUrl: v.optional(v.string()),
        title: v.optional(v.string()),
        caption: v.optional(v.string()),
        alt: v.optional(v.string()),
        taxonomyTermIds: v.optional(v.array(v.id("taxonomyTerms"))),
        categories: v.optional(v.array(v.string())),
        status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
        mimeType: v.optional(v.string()),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        uploadedAt: v.optional(v.number()),
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
        organizationId: v.optional(v.id("organizations")),
        storageId: v.optional(v.id("_storage")),
        previewImageStorageId: v.optional(v.id("_storage")),
        previewGeneratedAt: v.optional(v.number()),
        externalUrl: v.optional(v.string()),
        url: v.optional(v.string()),
        previewImageUrl: v.optional(v.string()),
        title: v.optional(v.string()),
        caption: v.optional(v.string()),
        alt: v.optional(v.string()),
        taxonomyTermIds: v.optional(v.array(v.id("taxonomyTerms"))),
        categories: v.optional(v.array(v.string())),
        status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
        mimeType: v.optional(v.string()),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        uploadedAt: v.optional(v.number()),
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
    taxonomyTermIds: v.optional(v.array(v.id("taxonomyTerms"))),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("mediaItems"),
      _creationTime: v.number(),
      organizationId: v.optional(v.id("organizations")),
      storageId: v.optional(v.id("_storage")),
      previewImageStorageId: v.optional(v.id("_storage")),
      previewGeneratedAt: v.optional(v.number()),
      externalUrl: v.optional(v.string()),
      url: v.optional(v.string()),
      previewImageUrl: v.optional(v.string()),
      title: v.optional(v.string()),
      caption: v.optional(v.string()),
      alt: v.optional(v.string()),
      taxonomyTermIds: v.optional(v.array(v.id("taxonomyTerms"))),
      categories: v.optional(v.array(v.string())),
      status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
      mimeType: v.optional(v.string()),
      width: v.optional(v.number()),
      height: v.optional(v.number()),
      uploadedAt: v.optional(v.number()),
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
      taxonomyTermIds?: Id<"taxonomyTerms">[];
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

    // Apply taxonomyTermIds filter if provided
    let filtered = filteredByStatus;
    if (args.taxonomyTermIds && args.taxonomyTermIds.length > 0) {
      filtered = filteredByStatus.filter((i) => {
        const ids = i.taxonomyTermIds ?? [];
        return ids.some(
          (c) =>
            (args.taxonomyTermIds as Id<"taxonomyTerms">[] | undefined)?.includes(
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
