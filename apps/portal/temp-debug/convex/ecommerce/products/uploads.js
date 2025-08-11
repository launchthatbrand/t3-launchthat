import { mutation } from "../../_generated/server";
import { v } from "convex/values";
/**
 * Generate upload URL for product images
 */
export const generateUploadUrl = mutation({
    args: {},
    returns: v.string(),
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});
/**
 * Store product image metadata after successful upload
 */
export const saveProductImage = mutation({
    args: {
        storageId: v.id("_storage"),
        productId: v.optional(v.id("products")),
        alt: v.optional(v.string()),
        position: v.optional(v.number()),
        isPrimary: v.optional(v.boolean()),
    },
    returns: v.object({
        storageId: v.id("_storage"),
        url: v.string(),
        alt: v.optional(v.string()),
        position: v.optional(v.number()),
        isPrimary: v.optional(v.boolean()),
    }),
    handler: async (ctx, args) => {
        // Get the URL for the uploaded file
        const url = await ctx.storage.getUrl(args.storageId);
        if (!url) {
            throw new Error("Failed to get URL for uploaded file");
        }
        // If productId is provided, we could save this association to a separate table
        // For now, we'll return the image data for the product form to handle
        return {
            storageId: args.storageId,
            url,
            alt: args.alt,
            position: args.position,
            isPrimary: args.isPrimary,
        };
    },
});
/**
 * Delete a product image from storage
 */
export const deleteProductImage = mutation({
    args: {
        storageId: v.id("_storage"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        // Delete the file from storage
        await ctx.storage.delete(args.storageId);
        return null;
    },
});
