import { api } from "../_generated/api";
import { query } from "../_generated/server";
import { v } from "convex/values";
/**
 * Get media item with URL by mediaItems ID
 */
export const getMediaItem = query({
    args: { id: v.id("mediaItems") },
    returns: v.union(v.null(), v.object({
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
    })),
    handler: async (ctx, args) => {
        const mediaItem = await ctx.db.get(args.id);
        if (!mediaItem) {
            return null;
        }
        // Get URL for storage items
        let url;
        if (mediaItem.storageId) {
            url = (await ctx.storage.getUrl(mediaItem.storageId)) ?? undefined;
        }
        else if (mediaItem.externalUrl) {
            url = mediaItem.externalUrl;
        }
        return {
            ...mediaItem,
            url,
            // Map legacy categories field if it exists
            categoryIds: mediaItem.categoryIds || [],
        };
    },
});
/**
 * Get media by storage ID
 */
export const getMediaByStorageId = query({
    args: { storageId: v.id("_storage") },
    returns: v.union(v.null(), v.object({
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
    })),
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
            categoryIds: mediaItem.categoryIds || [],
        };
    },
});
/**
 * Get media by ID
 */
export const getMediaById = query({
    args: { id: v.id("mediaItems") },
    returns: v.union(v.null(), v.object({
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
    })),
    handler: async (ctx, args) => {
        return await ctx.runQuery(api.media.getMediaItem, { id: args.id });
    },
});
/**
 * List media items with optional filtering and pagination
 */
export const listMediaItemsWithUrl = query({
    args: {
        limit: v.optional(v.number()),
        categoryIds: v.optional(v.array(v.id("categories"))), // Changed from categoryId
        status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
        searchTerm: v.optional(v.string()),
    },
    returns: v.array(v.object({
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
    })),
    handler: async (ctx, args) => {
        let items = await ctx.db.query("mediaItems").collect();
        // Apply filters
        if (args.status) {
            items = items.filter((item) => item.status === args.status);
        }
        if (args.categoryIds && args.categoryIds.length > 0) {
            items = items.filter((item) => {
                if (!item.categoryIds)
                    return false;
                return item.categoryIds.some((catId) => args.categoryIds.includes(catId));
            });
        }
        if (args.searchTerm) {
            const searchTerm = args.searchTerm.toLowerCase();
            items = items.filter((item) => {
                const titleMatch = item.title
                    ? item.title.toLowerCase().includes(searchTerm)
                    : false;
                const altMatch = item.alt
                    ? item.alt.toLowerCase().includes(searchTerm)
                    : false;
                const captionMatch = item.caption
                    ? item.caption.toLowerCase().includes(searchTerm)
                    : false;
                return titleMatch || altMatch || captionMatch;
            });
        }
        // Sort by creation time (newest first)
        items.sort((a, b) => b._creationTime - a._creationTime);
        // Apply limit
        if (args.limit) {
            items = items.slice(0, args.limit);
        }
        // Add URLs and process results
        const results = await Promise.all(items.map(async (item) => {
            let url;
            if (item.storageId) {
                url = (await ctx.storage.getUrl(item.storageId)) ?? undefined;
            }
            else if (item.externalUrl) {
                url = item.externalUrl;
            }
            return {
                ...item,
                url,
                categoryIds: item.categoryIds || [],
            };
        }));
        return results;
    },
});
/**
 * List media items (legacy function name - keeping for compatibility)
 */
export const listMedia = query({
    args: {
        limit: v.optional(v.number()),
        categoryIds: v.optional(v.array(v.id("categories"))),
        status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
        searchTerm: v.optional(v.string()),
    },
    returns: v.array(v.object({
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
    })),
    handler: async (ctx, args) => {
        return await ctx.runQuery(api.media.listMediaItemsWithUrl, args);
    },
});
/**
 * Legacy function for backward compatibility
 */
export const listImages = query({
    args: {
        limit: v.optional(v.number()),
        categoryIds: v.optional(v.array(v.id("categories"))),
    },
    returns: v.array(v.object({
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
    })),
    handler: async (ctx, args) => {
        return await ctx.runQuery(api.media.listMediaItemsWithUrl, {
            ...args,
            status: "published",
        });
    },
});
export const getImageById = query({
    args: { id: v.id("mediaItems") },
    returns: v.union(v.null(), v.object({
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
    })),
    handler: async (ctx, args) => {
        return await ctx.runQuery(api.media.getMediaItem, { id: args.id });
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
    returns: v.array(v.object({
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
    })),
    handler: async (ctx, args) => {
        return await ctx.runQuery(api.media.listMediaItemsWithUrl, {
            searchTerm: args.searchTerm,
            categoryIds: args.categoryIds,
            status: args.status,
            limit: args.limit,
        });
    },
});
