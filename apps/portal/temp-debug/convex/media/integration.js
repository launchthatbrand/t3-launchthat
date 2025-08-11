import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { api } from "../_generated/api";
/**
 * Link a media item to a post type
 */
export const linkMediaToPost = mutation({
    args: {
        mediaItemId: v.id("mediaItems"),
        postType: v.string(), // "posts", "lessons", "topics", "products", etc.
        postId: v.string(), // Generic post ID as string since we don't know the table
        fieldName: v.string(), // "featuredImageId", "featuredMedia", etc.
    },
    returns: v.object({
        success: v.boolean(),
        url: v.optional(v.string()),
    }),
    handler: async (ctx, args) => {
        // Get the media item
        const mediaItem = await ctx.db.get(args.mediaItemId);
        if (!mediaItem) {
            throw new ConvexError("Media item not found");
        }
        // Get the URL if it's a Convex storage item
        let url;
        if (mediaItem.storageId) {
            url = (await ctx.storage.getUrl(mediaItem.storageId)) ?? undefined;
        }
        else if (mediaItem.externalUrl) {
            url = mediaItem.externalUrl;
        }
        // Note: We can't dynamically update the post here since Convex doesn't allow
        // dynamic table access. The calling code should handle the actual post update.
        // This function primarily validates the media item and returns the URL.
        return {
            success: true,
            url,
        };
    },
});
/**
 * Create media and link to post in one operation
 */
export const createMediaForPost = mutation({
    args: {
        storageId: v.optional(v.id("_storage")),
        externalUrl: v.optional(v.string()),
        title: v.optional(v.string()),
        alt: v.optional(v.string()),
        caption: v.optional(v.string()),
        categories: v.optional(v.array(v.string())),
        status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    },
    returns: v.object({
        mediaItemId: v.id("mediaItems"),
        url: v.optional(v.string()),
    }),
    handler: async (ctx, args) => {
        // Validate that we have either storageId or externalUrl
        if (!args.storageId && !args.externalUrl) {
            throw new ConvexError("Either storageId or externalUrl must be provided");
        }
        // Get URL for Convex storage
        let url;
        if (args.storageId) {
            url = (await ctx.storage.getUrl(args.storageId)) ?? undefined;
            if (!url) {
                throw new ConvexError("Could not generate URL for storage ID");
            }
        }
        else if (args.externalUrl) {
            url = args.externalUrl;
        }
        // Create media item
        const mediaItemId = await ctx.db.insert("mediaItems", {
            storageId: args.storageId,
            externalUrl: args.externalUrl,
            title: args.title,
            alt: args.alt,
            caption: args.caption,
            categories: args.categories,
            status: args.status ?? "published",
            uploadedAt: Date.now(),
        });
        return {
            mediaItemId,
            url,
        };
    },
});
/**
 * Get media with URL for a specific media item ID
 */
export const getMediaWithUrl = query({
    args: {
        mediaItemId: v.id("mediaItems"),
    },
    returns: v.union(v.null(), v.object({
        _id: v.id("mediaItems"),
        url: v.optional(v.string()),
        title: v.optional(v.string()),
        alt: v.optional(v.string()),
        caption: v.optional(v.string()),
    })),
    handler: async (ctx, args) => {
        const mediaItem = await ctx.db.get(args.mediaItemId);
        if (!mediaItem) {
            return null;
        }
        // Get URL
        let url;
        if (mediaItem.storageId) {
            url = (await ctx.storage.getUrl(mediaItem.storageId)) ?? undefined;
        }
        else if (mediaItem.externalUrl) {
            url = mediaItem.externalUrl;
        }
        return {
            _id: mediaItem._id,
            url,
            title: mediaItem.title,
            alt: mediaItem.alt,
            caption: mediaItem.caption,
        };
    },
});
/**
 * Helper function to create featured media object for LMS
 * Returns the structure expected by lessons and topics
 */
export const createLMSFeaturedMedia = mutation({
    args: {
        storageId: v.optional(v.id("_storage")),
        vimeoId: v.optional(v.string()),
        vimeoUrl: v.optional(v.string()),
        title: v.optional(v.string()),
        alt: v.optional(v.string()),
        caption: v.optional(v.string()),
    },
    returns: v.union(v.object({ type: v.literal("convex"), mediaItemId: v.id("mediaItems") }), v.object({
        type: v.literal("vimeo"),
        vimeoId: v.string(),
        vimeoUrl: v.string(),
    })),
    handler: async (ctx, args) => {
        if (args.storageId) {
            // Create Convex media item
            const mediaResult = await ctx.runMutation(api.media.integration.createMediaForPost, {
                storageId: args.storageId,
                title: args.title,
                alt: args.alt,
                caption: args.caption,
                status: "published",
            });
            return {
                type: "convex",
                mediaItemId: mediaResult.mediaItemId,
            };
        }
        else if (args.vimeoId && args.vimeoUrl) {
            // Return Vimeo media structure
            return {
                type: "vimeo",
                vimeoId: args.vimeoId,
                vimeoUrl: args.vimeoUrl,
            };
        }
        else {
            throw new ConvexError("Must provide either storageId for Convex media or vimeoId/vimeoUrl for Vimeo media");
        }
    },
});
/**
 * Helper function to create product images array
 * Converts media items to the format expected by products
 */
export const createProductImages = mutation({
    args: {
        mediaItems: v.array(v.object({
            mediaItemId: v.id("mediaItems"),
            alt: v.optional(v.string()),
            position: v.optional(v.number()),
            isPrimary: v.optional(v.boolean()),
        })),
    },
    returns: v.array(v.object({
        url: v.string(),
        alt: v.optional(v.string()),
        position: v.optional(v.number()),
        isPrimary: v.optional(v.boolean()),
        // Additional fields from media upload system
        name: v.optional(v.string()),
        size: v.optional(v.number()),
        storageId: v.optional(v.id("_storage")),
    })),
    handler: async (ctx, args) => {
        const images = [];
        for (const item of args.mediaItems) {
            const mediaItem = await ctx.db.get(item.mediaItemId);
            if (!mediaItem)
                continue;
            // Get URL and size information
            let url;
            let fileSize;
            if (mediaItem.storageId) {
                url = (await ctx.storage.getUrl(mediaItem.storageId)) ?? undefined;
                // Get file metadata for size
                try {
                    const metadata = await ctx.db.system.get(mediaItem.storageId);
                    fileSize = metadata?.size;
                }
                catch (error) {
                    // Ignore error, size will be undefined
                }
            }
            else if (mediaItem.externalUrl) {
                url = mediaItem.externalUrl;
            }
            if (url) {
                images.push({
                    url,
                    alt: item.alt ?? mediaItem.alt,
                    position: item.position,
                    isPrimary: item.isPrimary,
                    // Additional metadata from media item
                    name: mediaItem.title,
                    size: fileSize,
                    storageId: mediaItem.storageId,
                });
            }
        }
        return images;
    },
});
/**
 * Bulk create media items from storage IDs
 * Useful for batch uploads
 */
export const bulkCreateMedia = mutation({
    args: {
        items: v.array(v.object({
            storageId: v.optional(v.id("_storage")),
            externalUrl: v.optional(v.string()),
            title: v.optional(v.string()),
            alt: v.optional(v.string()),
            caption: v.optional(v.string()),
            categories: v.optional(v.array(v.string())),
        })),
    },
    returns: v.array(v.object({
        mediaItemId: v.id("mediaItems"),
        url: v.optional(v.string()),
    })),
    handler: async (ctx, args) => {
        const results = [];
        for (const item of args.items) {
            try {
                const result = await ctx.runMutation(api.media.integration.createMediaForPost, {
                    ...item,
                    status: "published",
                });
                results.push(result);
            }
            catch (error) {
                // Skip failed items but continue processing others
                console.error("Failed to create media item:", error);
            }
        }
        return results;
    },
});
