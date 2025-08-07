import { v } from "convex/values";

import { query } from "../../_generated/server";

/**
 * List all products
 */
export const listProducts = query({
  args: {
    isVisible: v.optional(v.boolean()),
    status: v.optional(
      v.union(v.literal("draft"), v.literal("active"), v.literal("archived")),
    ),
    categoryId: v.optional(v.id("productCategories")),
  },
  handler: async (ctx, args) => {
    let productsQuery = ctx.db.query("products");

    // Apply filters if provided
    if (args.isVisible !== undefined) {
      productsQuery = productsQuery.filter((q) =>
        q.eq(q.field("isVisible"), args.isVisible),
      );
    }

    if (args.status !== undefined) {
      productsQuery = productsQuery.filter((q) =>
        q.eq(q.field("status"), args.status),
      );
    }

    // Get all products with the applied filters
    const allFilteredProducts = await productsQuery.collect();

    // If categoryId is specified, filter products that have it as primary or in categoryIds
    if (args.categoryId !== undefined) {
      const categoryIdString = args.categoryId as string;
      return allFilteredProducts.filter((product) => {
        // Check primaryCategoryId match
        const primaryMatch = product.primaryCategoryId === categoryIdString;

        // Check if category is in categoryIds array
        let categoryIdsMatch = false;
        if (Array.isArray(product.categoryIds)) {
          categoryIdsMatch = product.categoryIds.some(
            (id) => id === categoryIdString,
          );
        }

        return primaryMatch || categoryIdsMatch;
      });
    }

    return allFilteredProducts;
  },
});

/**
 * Get a single product by ID
 */
export const getProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.productId);
  },
});

/**
 * Get total count of products
 */
export const getProductCount = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    return products.length;
  },
});
