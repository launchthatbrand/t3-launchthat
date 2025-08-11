import { v } from "convex/values";
import { query } from "../../_generated/server";
/**
 * Get product variations
 */
export const getProductVariations = query({
    args: {
        productId: v.id("products"),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("productVariants")
            .filter((q) => q.eq(q.field("productId"), args.productId))
            .collect();
    },
});
/**
 * Get variation by ID
 */
export const getVariation = query({
    args: {
        variationId: v.id("productVariants"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.variationId);
    },
});
