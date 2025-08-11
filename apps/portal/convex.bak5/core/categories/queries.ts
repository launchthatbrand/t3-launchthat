import { v } from "convex/values";

import { Id } from "../../_generated/dataModel";
import { query } from "../../_generated/server";

/**
 * Get all categories from the categories table
 */
export const getCategories = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      description: v.optional(v.string()),
      parentId: v.optional(v.id("categories")),
      metadata: v.optional(
        v.record(v.string(), v.union(v.string(), v.number(), v.boolean())),
      ),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    return categories;
  },
});

/**
 * Get categories derived from products' categoryIds field
 */
export const getProductCategories = query({
  args: {},
  returns: v.array(
    v.object({
      categoryId: v.id("categories"),
      count: v.number(),
    }),
  ),
  handler: async (ctx) => {
    // Query all products to get category usage
    const products = await ctx.db.query("products").collect();

    // Count products by category
    const categoryMap: Record<string, number> = {};

    for (const product of products) {
      const categoryIds = product.categoryIds ?? [];
      for (const categoryId of categoryIds) {
        categoryMap[categoryId] = (categoryMap[categoryId] ?? 0) + 1;
      }
    }

    // Convert to array of category objects
    const categories = Object.entries(categoryMap).map(
      ([categoryId, count]) => ({
        categoryId: categoryId as Id<"categories">,
        count,
      }),
    );

    return categories;
  },
});

/**
 * Get category by slug
 */
export const getCategoryBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      description: v.optional(v.string()),
      parentId: v.optional(v.id("categories")),
      metadata: v.optional(
        v.record(v.string(), v.union(v.string(), v.number(), v.boolean())),
      ),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    return category;
  },
});

/**
 * Get category by ID
 */
export const getCategoryById = query({
  args: { id: v.id("categories") },
  returns: v.union(
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      description: v.optional(v.string()),
      parentId: v.optional(v.id("categories")),
      metadata: v.optional(
        v.record(v.string(), v.union(v.string(), v.number(), v.boolean())),
      ),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.id);
    return category;
  },
});

/**
 * Get child categories by parent ID
 */
export const getChildCategories = query({
  args: { parentId: v.optional(v.id("categories")) },
  returns: v.array(
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      description: v.optional(v.string()),
      parentId: v.optional(v.id("categories")),
      metadata: v.optional(
        v.record(v.string(), v.union(v.string(), v.number(), v.boolean())),
      ),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .collect();

    return categories;
  },
});
