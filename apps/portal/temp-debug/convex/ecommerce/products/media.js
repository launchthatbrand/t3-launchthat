import { ConvexError, v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { api } from "../../_generated/api";
/**
 * Add media to a product using media items
 */
export const addProductMedia = mutation({
    args: {
        productId: v.id("products"),
        mediaItems: v.array(v.object({
            mediaItemId: v.id("mediaItems"),
            alt: v.optional(v.string()),
            position: v.optional(v.number()),
            isPrimary: v.optional(v.boolean()),
        })),
    },
    returns: v.object({
        success: v.boolean(),
        imagesAdded: v.number(),
    }),
    handler: async (ctx, args) => {
        // Get the product
        const product = await ctx.db.get(args.productId);
        if (!product) {
            throw new ConvexError("Product not found");
        }
        // Convert media items to product images format
        const newImages = await ctx.runMutation(api.media.createProductImages, {
            mediaItems: args.mediaItems,
        });
        // Add to existing images
        const updatedImages = [...product.images, ...newImages];
        // Update mediaItems array
        const existingMediaItems = product.mediaItems || [];
        const updatedMediaItems = [...existingMediaItems, ...args.mediaItems];
        // Update the product
        await ctx.db.patch(args.productId, {
            images: updatedImages,
            mediaItems: updatedMediaItems,
            updatedAt: Date.now(),
        });
        return {
            success: true,
            imagesAdded: newImages.length,
        };
    },
});
/**
 * Replace all product media with new media items
 */
export const replaceProductMedia = mutation({
    args: {
        productId: v.id("products"),
        mediaItems: v.array(v.object({
            mediaItemId: v.id("mediaItems"),
            alt: v.optional(v.string()),
            position: v.optional(v.number()),
            isPrimary: v.optional(v.boolean()),
        })),
    },
    returns: v.object({
        success: v.boolean(),
        totalImages: v.number(),
    }),
    handler: async (ctx, args) => {
        // Get the product
        const product = await ctx.db.get(args.productId);
        if (!product) {
            throw new ConvexError("Product not found");
        }
        // Convert media items to product images format
        const newImages = await ctx.runMutation(api.media.createProductImages, {
            mediaItems: args.mediaItems,
        });
        // Update the product
        await ctx.db.patch(args.productId, {
            images: newImages,
            mediaItems: args.mediaItems,
            updatedAt: Date.now(),
        });
        return {
            success: true,
            totalImages: newImages.length,
        };
    },
});
/**
 * Remove specific media from product
 */
export const removeProductMedia = mutation({
    args: {
        productId: v.id("products"),
        mediaItemIds: v.array(v.id("mediaItems")),
    },
    returns: v.object({
        success: v.boolean(),
        removedCount: v.number(),
    }),
    handler: async (ctx, args) => {
        // Get the product
        const product = await ctx.db.get(args.productId);
        if (!product) {
            throw new ConvexError("Product not found");
        }
        // Filter out the media items to be removed
        const remainingMediaItems = (product.mediaItems || []).filter((item) => !args.mediaItemIds.includes(item.mediaItemId));
        // Regenerate images from remaining media items
        const newImages = remainingMediaItems.length > 0
            ? await ctx.runMutation(api.media.createProductImages, {
                mediaItems: remainingMediaItems,
            })
            : [];
        // Update the product
        await ctx.db.patch(args.productId, {
            images: newImages,
            mediaItems: remainingMediaItems,
            updatedAt: Date.now(),
        });
        return {
            success: true,
            removedCount: (product.mediaItems?.length || 0) - remainingMediaItems.length,
        };
    },
});
/**
 * Get product with all media URLs resolved
 */
export const getProductWithMedia = query({
    args: {
        productId: v.id("products"),
    },
    returns: v.union(v.null(), v.object({
        _id: v.id("products"),
        name: v.string(),
        description: v.optional(v.string()),
        price: v.number(),
        images: v.array(v.object({
            url: v.string(),
            alt: v.optional(v.string()),
            position: v.optional(v.number()),
            isPrimary: v.optional(v.boolean()),
        })),
        mediaItems: v.optional(v.array(v.object({
            _id: v.id("mediaItems"),
            url: v.optional(v.string()),
            title: v.optional(v.string()),
            alt: v.optional(v.string()),
            position: v.optional(v.number()),
            isPrimary: v.optional(v.boolean()),
        }))),
    })),
    handler: async (ctx, args) => {
        const product = await ctx.db.get(args.productId);
        if (!product) {
            return null;
        }
        // Resolve media item URLs
        const mediaItemsWithUrls = [];
        if (product.mediaItems) {
            for (const item of product.mediaItems) {
                const mediaWithUrl = await ctx.runQuery(api.media.getMediaWithUrl, {
                    mediaItemId: item.mediaItemId,
                });
                if (mediaWithUrl) {
                    mediaItemsWithUrls.push({
                        ...mediaWithUrl,
                        position: item.position,
                        isPrimary: item.isPrimary,
                    });
                }
            }
        }
        return {
            _id: product._id,
            name: product.name,
            description: product.description,
            price: product.price,
            images: product.images,
            mediaItems: mediaItemsWithUrls.length > 0 ? mediaItemsWithUrls : undefined,
        };
    },
});
/**
 * Create product with media upload in one operation
 */
export const createProductWithMedia = mutation({
    args: {
        // Basic product info
        name: v.string(),
        description: v.optional(v.string()),
        price: v.number(),
        sku: v.string(),
        slug: v.string(),
        primaryCategoryId: v.id("productCategories"),
        categoryIds: v.array(v.id("productCategories")),
        isDigital: v.boolean(),
        hasVariants: v.boolean(),
        isFeatured: v.boolean(),
        taxable: v.boolean(),
        status: v.string(),
        isVisible: v.boolean(),
        // Media
        storageIds: v.optional(v.array(v.id("_storage"))),
        mediaMetadata: v.optional(v.array(v.object({
            title: v.optional(v.string()),
            alt: v.optional(v.string()),
            caption: v.optional(v.string()),
            position: v.optional(v.number()),
            isPrimary: v.optional(v.boolean()),
        }))),
    },
    returns: v.object({
        productId: v.id("products"),
        mediaItemIds: v.array(v.id("mediaItems")),
    }),
    handler: async (ctx, args) => {
        const timestamp = Date.now();
        // Create media items first
        const mediaItemIds = [];
        const mediaItems = [];
        if (args.storageIds && args.storageIds.length > 0) {
            for (let i = 0; i < args.storageIds.length; i++) {
                const storageId = args.storageIds[i];
                const metadata = args.mediaMetadata?.[i] || {};
                const mediaResult = await ctx.runMutation(api.media.createMediaForPost, {
                    storageId,
                    title: metadata.title,
                    alt: metadata.alt,
                    caption: metadata.caption,
                    status: "published",
                });
                mediaItemIds.push(mediaResult.mediaItemId);
                mediaItems.push({
                    mediaItemId: mediaResult.mediaItemId,
                    alt: metadata.alt,
                    position: metadata.position ?? i,
                    isPrimary: metadata.isPrimary ?? i === 0,
                });
            }
        }
        // Generate images array from media items
        const images = mediaItems.length > 0
            ? await ctx.runMutation(api.media.createProductImages, {
                mediaItems,
            })
            : [];
        // Create the product
        const productId = await ctx.db.insert("products", {
            name: args.name,
            description: args.description,
            price: args.price,
            priceInCents: Math.round(args.price * 100), // Backward compatibility
            sku: args.sku,
            slug: args.slug,
            primaryCategoryId: args.primaryCategoryId,
            categoryIds: args.categoryIds,
            isDigital: args.isDigital,
            hasVariants: args.hasVariants,
            isFeatured: args.isFeatured,
            taxable: args.taxable,
            status: args.status,
            isVisible: args.isVisible,
            isPublished: args.status === "published", // Backward compatibility
            images,
            mediaItems: mediaItems.length > 0 ? mediaItems : undefined,
            createdAt: timestamp,
            updatedAt: timestamp,
        });
        return {
            productId,
            mediaItemIds,
        };
    },
});
