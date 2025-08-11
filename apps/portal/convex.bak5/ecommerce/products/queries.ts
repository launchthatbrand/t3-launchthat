import type { Doc } from "@convex-config/_generated/dataModel";
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
    categoryId: v.optional(v.id("categories")),
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
      const categoryIdString = args.categoryId;
      return allFilteredProducts.filter((product) => {
        // Check if category is in categoryIds array
        let categoryIdsMatch = false;
        if (Array.isArray(product.categoryIds)) {
          categoryIdsMatch = product.categoryIds.some(
            (id) => id === categoryIdString,
          );
        }

        return categoryIdsMatch;
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    return allFilteredProducts as Doc<"products">[];
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

/**
 * Get total count of product categories (kept here to match current frontend call path)
 */
export const getCategoryCount = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    return categories.length;
  },
});
