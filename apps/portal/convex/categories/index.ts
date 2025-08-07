import { ConvexError, v } from "convex/values";
import { generateUniqueSlug, sanitizeSlug } from "../lib/slugs";
import { mutation, query } from "../_generated/server";

import type { Id } from "../_generated/dataModel";
import { api } from "../_generated/api";

/**
 * Get categories by post type(s)
 */
export const getCategoriesByPostType = query({
  args: {
    postTypes: v.array(v.string()), // e.g., ["posts", "media"]
    parentId: v.optional(v.id("categories")),
    isActive: v.optional(v.boolean()),
    isVisible: v.optional(v.boolean()),
    isPublic: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      description: v.optional(v.string()),
      postTypes: v.array(v.string()),
      parentId: v.optional(v.id("categories")),
      level: v.number(),
      path: v.array(v.id("categories")),
      imageUrl: v.optional(v.string()),
      iconUrl: v.optional(v.string()),
      color: v.optional(v.string()),
      displayOrder: v.optional(v.number()),
      isActive: v.boolean(),
      isVisible: v.boolean(),
      isPublic: v.optional(v.boolean()),
      metaTitle: v.optional(v.string()),
      metaDescription: v.optional(v.string()),
      metaKeywords: v.optional(v.array(v.string())),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    // Get all categories
    let categories = await ctx.db.query("categories").collect();

    // Filter by post types - category must have at least one matching post type
    categories = categories.filter((category) =>
      category.postTypes.some((postType) => args.postTypes.includes(postType)),
    );

    // Apply additional filters
    if (args.parentId !== undefined) {
      categories = categories.filter((c) => c.parentId === args.parentId);
    }
    if (args.isActive !== undefined) {
      categories = categories.filter((c) => c.isActive === args.isActive);
    }
    if (args.isVisible !== undefined) {
      categories = categories.filter((c) => c.isVisible === args.isVisible);
    }
    if (args.isPublic !== undefined) {
      categories = categories.filter((c) => c.isPublic === args.isPublic);
    }

    // Sort by display order, then by name
    return categories.sort((a, b) => {
      if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
        return a.displayOrder - b.displayOrder;
      }
      if (a.displayOrder !== undefined) return -1;
      if (b.displayOrder !== undefined) return 1;
      return a.name.localeCompare(b.name);
    });
  },
});

/**
 * Get category tree for specific post types
 */
export const getCategoryTree = query({
  args: {
    postTypes: v.array(v.string()),
    isActive: v.optional(v.boolean()),
    isVisible: v.optional(v.boolean()),
  },
  returns: v.array(v.any()), // Use v.any() to allow recursive structure
  handler: async (ctx, args) => {
    // Get filtered categories
    const categories = await ctx.runQuery(
      api.categories.getCategoriesByPostType,
      {
        postTypes: args.postTypes,
        isActive: args.isActive,
        isVisible: args.isVisible,
      },
    );

    // Build tree structure
    const categoryMap = new Map(
      categories.map((cat: any) => [cat._id, { ...cat, children: [] }]),
    );
    const rootCategories: any[] = [];

    for (const category of categories) {
      const categoryWithChildren = categoryMap.get(category._id)!;

      if (category.parentId && categoryMap.has(category.parentId)) {
        const parent = categoryMap.get(category.parentId)!;
        parent.children.push(categoryWithChildren);
      } else {
        rootCategories.push(categoryWithChildren);
      }
    }

    return rootCategories;
  },
});

/**
 * Get single category by ID
 */
export const getCategoryById = query({
  args: { categoryId: v.id("categories") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      description: v.optional(v.string()),
      postTypes: v.array(v.string()),
      parentId: v.optional(v.id("categories")),
      level: v.number(),
      path: v.array(v.id("categories")),
      imageUrl: v.optional(v.string()),
      iconUrl: v.optional(v.string()),
      color: v.optional(v.string()),
      displayOrder: v.optional(v.number()),
      isActive: v.boolean(),
      isVisible: v.boolean(),
      isPublic: v.optional(v.boolean()),
      metaTitle: v.optional(v.string()),
      metaDescription: v.optional(v.string()),
      metaKeywords: v.optional(v.array(v.string())),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.categoryId);
  },
});

/**
 * Get category by slug
 */
export const getCategoryBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      description: v.optional(v.string()),
      postTypes: v.array(v.string()),
      parentId: v.optional(v.id("categories")),
      level: v.number(),
      path: v.array(v.id("categories")),
      imageUrl: v.optional(v.string()),
      iconUrl: v.optional(v.string()),
      color: v.optional(v.string()),
      displayOrder: v.optional(v.number()),
      isActive: v.boolean(),
      isVisible: v.boolean(),
      isPublic: v.optional(v.boolean()),
      metaTitle: v.optional(v.string()),
      metaDescription: v.optional(v.string()),
      metaKeywords: v.optional(v.array(v.string())),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

/**
 * Create a new category
 */
export const createCategory = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    postTypes: v.array(v.string()),
    parentId: v.optional(v.id("categories")),
    imageUrl: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    color: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    isVisible: v.optional(v.boolean()),
    isPublic: v.optional(v.boolean()),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    metaKeywords: v.optional(v.array(v.string())),
    customSlug: v.optional(v.string()),
  },
  returns: v.id("categories"),
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    // Generate unique slug
    let slug: string;
    if (args.customSlug) {
      const sanitizedSlug = sanitizeSlug(args.customSlug);
      slug = await generateUniqueSlug(ctx.db, "categories", sanitizedSlug);
    } else {
      slug = await generateUniqueSlug(ctx.db, "categories", args.name);
    }

    // Calculate level and path based on parent
    let level = 0;
    let path: Id<"categories">[] = [];

    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (!parent) {
        throw new ConvexError({
          code: "not_found",
          message: "Parent category not found",
        });
      }
      level = parent.level + 1;
      path = [...parent.path, args.parentId];
    }

    // Create the category
    const categoryId = await ctx.db.insert("categories", {
      name: args.name,
      slug,
      description: args.description,
      postTypes: args.postTypes,
      parentId: args.parentId,
      level,
      path,
      imageUrl: args.imageUrl,
      iconUrl: args.iconUrl,
      color: args.color,
      displayOrder: args.displayOrder,
      isActive: args.isActive ?? true,
      isVisible: args.isVisible ?? true,
      isPublic: args.isPublic ?? true,
      metaTitle: args.metaTitle,
      metaDescription: args.metaDescription,
      metaKeywords: args.metaKeywords,
      updatedAt: timestamp,
    });

    return categoryId;
  },
});

/**
 * Update an existing category
 */
export const updateCategory = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    postTypes: v.optional(v.array(v.string())),
    parentId: v.optional(v.id("categories")),
    imageUrl: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    color: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    isVisible: v.optional(v.boolean()),
    isPublic: v.optional(v.boolean()),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    metaKeywords: v.optional(v.array(v.string())),
  },
  returns: v.id("categories"),
  handler: async (ctx, args) => {
    const { categoryId, ...updates } = args;

    // Get existing category
    const existingCategory = await ctx.db.get(categoryId);
    if (!existingCategory) {
      throw new ConvexError({
        code: "not_found",
        message: "Category not found",
      });
    }

    // Handle parent changes - recalculate level and path
    if (updates.parentId !== undefined) {
      let level = 0;
      let path: Id<"categories">[] = [];

      if (updates.parentId) {
        const parent = await ctx.db.get(updates.parentId);
        if (!parent) {
          throw new ConvexError({
            code: "not_found",
            message: "Parent category not found",
          });
        }
        level = parent.level + 1;
        path = [...parent.path, updates.parentId];
      }

      (updates as any).level = level;
      (updates as any).path = path;
    }

    // Update the category
    await ctx.db.patch(categoryId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return categoryId;
  },
});

/**
 * Delete a category
 */
export const deleteCategory = mutation({
  args: {
    categoryId: v.id("categories"),
    moveChildrenToParent: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    deletedCategoryId: v.id("categories"),
    movedChildrenCount: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get the category to delete
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new ConvexError({
        code: "not_found",
        message: "Category not found",
      });
    }

    // Find child categories
    const children = await ctx.db
      .query("categories")
      .withIndex("by_parent", (q) => q.eq("parentId", args.categoryId))
      .collect();

    let movedChildrenCount = 0;

    if (children.length > 0) {
      if (args.moveChildrenToParent) {
        // Move children to this category's parent
        for (const child of children) {
          let newLevel = category.level;
          let newPath = [...category.path];

          if (category.parentId) {
            // Moving to grandparent
            newLevel = category.level - 1;
            newPath = category.path.slice(0, -1);
          } else {
            // Moving to root level
            newLevel = 0;
            newPath = [];
          }

          await ctx.db.patch(child._id, {
            parentId: category.parentId,
            level: newLevel,
            path: newPath,
            updatedAt: Date.now(),
          });
          movedChildrenCount++;
        }
      } else {
        // Delete all children recursively
        for (const child of children) {
          await ctx.runMutation(api.categories.deleteCategory, {
            categoryId: child._id,
            moveChildrenToParent: false,
          });
        }
      }
    }

    // Delete the category
    await ctx.db.delete(args.categoryId);

    return {
      success: true,
      deletedCategoryId: args.categoryId,
      movedChildrenCount,
    };
  },
});

/**
 * Search categories
 */
export const searchCategories = query({
  args: {
    searchTerm: v.string(),
    postTypes: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      description: v.optional(v.string()),
      postTypes: v.array(v.string()),
      level: v.number(),
      isActive: v.boolean(),
      isVisible: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("categories")
      .withSearchIndex("search_categories", (q) =>
        q.search("name", args.searchTerm),
      )
      .take(args.limit ?? 20);

    // Filter by post types if specified
    let filteredResults = results;
    if (args.postTypes && args.postTypes.length > 0) {
      filteredResults = results.filter((category) =>
        category.postTypes.some((postType) =>
          args.postTypes!.includes(postType),
        ),
      );
    }

    return filteredResults.map((category) => ({
      _id: category._id,
      _creationTime: category._creationTime,
      name: category.name,
      slug: category.slug,
      description: category.description,
      postTypes: category.postTypes,
      level: category.level,
      isActive: category.isActive,
      isVisible: category.isVisible,
    }));
  },
});

// Export migration functions
export {
  migrateCategoriesToGlobal,
  previewCategoryMigration,
  cleanupOldCategoryTables,
  validateMigration,
} from "./migration";
