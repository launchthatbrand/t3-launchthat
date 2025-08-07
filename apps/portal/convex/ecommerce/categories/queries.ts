import { v } from "convex/values";

import type { Doc } from "../../_generated/dataModel";
import { query } from "../../_generated/server";

// Define an interface for category with children for the tree structure
interface CategoryWithChildren extends Doc<"productCategories"> {
  children: CategoryWithChildren[];
}

/**
 * Get all product categories
 */
export const getProductCategories = query({
  args: {
    parentId: v.optional(v.id("productCategories")),
    isActive: v.optional(v.boolean()),
    isVisible: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("productCategories"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      description: v.optional(v.string()),
      parentId: v.optional(v.id("productCategories")),
      level: v.number(),
      path: v.array(v.id("productCategories")),
      imageUrl: v.optional(v.string()),
      iconUrl: v.optional(v.string()),
      displayOrder: v.optional(v.number()),
      isActive: v.boolean(),
      isVisible: v.boolean(),
      metaTitle: v.optional(v.string()),
      metaDescription: v.optional(v.string()),
      metaKeywords: v.optional(v.array(v.string())),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    let categoriesQuery;

    if (args.parentId !== undefined) {
      categoriesQuery = ctx.db
        .query("productCategories")
        .withIndex("by_parent", (q) => q.eq("parentId", args.parentId));
    } else {
      categoriesQuery = ctx.db.query("productCategories");
    }

    let categories = await categoriesQuery.collect();

    // Apply filters if provided
    if (args.isActive !== undefined) {
      categories = categories.filter((cat) => cat.isActive === args.isActive);
    }

    if (args.isVisible !== undefined) {
      categories = categories.filter((cat) => cat.isVisible === args.isVisible);
    }

    // Sort by displayOrder first (ascending), then by name
    categories.sort((a, b) => {
      const orderA = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.displayOrder ?? Number.MAX_SAFE_INTEGER;

      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.name.localeCompare(b.name);
    });

    return categories;
  },
});

/**
 * Get category tree structure with nested children
 */
export const getCategoryTree = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const allCategories = await ctx.db.query("productCategories").collect();

    // Create a map for quick lookup by ID
    const categoryMap = new Map<string, CategoryWithChildren>();
    const rootCategories: CategoryWithChildren[] = [];

    // First pass: Create all category objects with empty children arrays
    allCategories.forEach((category) => {
      categoryMap.set(category._id, { ...category, children: [] });
    });

    // Second pass: Build the tree structure
    allCategories.forEach((category) => {
      const categoryWithChildren = categoryMap.get(category._id);
      if (!categoryWithChildren) return;

      if (category.parentId) {
        // This is a child category
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children.push(categoryWithChildren);
        }
      } else {
        // This is a root category
        rootCategories.push(categoryWithChildren);
      }
    });

    // Sort function for categories
    const sortCategories = (categories: CategoryWithChildren[]) => {
      categories.sort((a, b) => {
        const orderA = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.displayOrder ?? Number.MAX_SAFE_INTEGER;

        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return a.name.localeCompare(b.name);
      });

      // Recursively sort children
      categories.forEach((category) => {
        if (category.children.length > 0) {
          sortCategories(category.children);
        }
      });
    };

    sortCategories(rootCategories);

    return rootCategories;
  },
});

/**
 * Get a single category by ID
 */
export const getCategory = query({
  args: { categoryId: v.id("productCategories") },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.categoryId);
  },
});

/**
 * Get a category by slug
 */
export const getCategoryBySlug = query({
  args: { slug: v.string() },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("productCategories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

/**
 * Get category breadcrumbs for navigation
 */
export const getCategoryBreadcrumbs = query({
  args: { categoryId: v.id("productCategories") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId);
    if (!category) return [];

    const breadcrumbs: Doc<"productCategories">[] = [];

    // Follow the path array to build breadcrumbs
    for (const pathCategoryId of category.path) {
      const pathCategory = await ctx.db.get(pathCategoryId);
      if (pathCategory) {
        breadcrumbs.push(pathCategory);
      }
    }

    // Add the current category
    breadcrumbs.push(category);

    return breadcrumbs;
  },
});

/**
 * Get total count of categories
 */
export const getCategoryCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const categories = await ctx.db.query("productCategories").collect();
    return categories.length;
  },
});
