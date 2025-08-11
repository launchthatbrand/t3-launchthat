import { v } from "convex/values";
import { mutation } from "../../_generated/server";
/**
 * Create product variant (simplified)
 */
export const createProductVariant = mutation({
    args: {
        productId: v.id("products"),
        name: v.string(),
        price: v.number(),
        sku: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const variant = {
            productId: args.productId,
            name: args.name,
            priceInCents: Math.round(args.price * 100), // Convert to cents
            sku: args.sku,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        return await ctx.db.insert("productVariants", variant);
    },
});
/**
 * Update product variant (simplified)
 */
export const updateProductVariant = mutation({
    args: {
        variantId: v.id("productVariants"),
        name: v.optional(v.string()),
        price: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { variantId, ...updates } = args;
        await ctx.db.patch(variantId, {
            ...updates,
            updatedAt: Date.now(),
        });
        return { success: true };
    },
});
/**
 * Delete product variant
 */
export const deleteProductVariant = mutation({
    args: {
        variantId: v.id("productVariants"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.variantId);
        return { success: true };
    },
});
