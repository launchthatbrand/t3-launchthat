import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { mutation } from "../../_generated/server";
import { requireAdmin } from "../../lib/permissions/requirePermission";
import { generateCategorySlug, updateChildrenPathsAndLevels } from "./helpers";

/**
 * Create a new category
 */
export const createCategory = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    parentId: v.optional(v.id("productCategories")),
    imageUrl: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
    isActive: v.boolean(),
    isVisible: v.boolean(),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    metaKeywords: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const slug = await generateCategorySlug(ctx, args.name);

    // Determine level and path based on parent
    let level = 0;
    let path: Id<"productCategories">[] = [];

    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (!parent) {
        throw new Error("Parent category not found");
      }
      level = parent.level + 1;
      path = [...parent.path, parent._id];
    }

    const timestamp = Date.now();

    return await ctx.db.insert("productCategories", {
      name: args.name,
      slug,
      description: args.description,
      parentId: args.parentId,
      level,
      path,
      imageUrl: args.imageUrl,
      iconUrl: args.iconUrl,
      displayOrder: args.displayOrder,
      isActive: args.isActive,
      isVisible: args.isVisible,
      metaTitle: args.metaTitle,
      metaDescription: args.metaDescription,
      metaKeywords: args.metaKeywords ?? [],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },
});

/**
 * Update an existing category
 */
export const updateCategory = mutation({
  args: {
    categoryId: v.id("productCategories"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    parentId: v.optional(v.union(v.id("productCategories"), v.null())),
    imageUrl: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    isVisible: v.optional(v.boolean()),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    metaKeywords: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const { categoryId, parentId, ...updateData } = args;

    // Get the current category
    const currentCategory = await ctx.db.get(categoryId);
    if (!currentCategory) {
      throw new Error("Category not found");
    }

    const baseUpdates = {
      ...updateData,
      updatedAt: Date.now(),
    };

    // Handle slug update if name changed
    if (updateData.name) {
      const slug = await generateCategorySlug(ctx, updateData.name, categoryId);

      // Handle parent change
      if (parentId !== undefined) {
        if (parentId === null) {
          // Moving to root level
          await ctx.db.patch(categoryId, {
            ...baseUpdates,
            slug,
            parentId: undefined,
            level: 0,
            path: [],
          });
        } else {
          // Moving under a new parent
          if (parentId === categoryId) {
            throw new Error("A category cannot be its own parent");
          }

          const newParent = await ctx.db.get(parentId);
          if (!newParent) {
            throw new Error("Parent category not found");
          }

          // Check if the new parent would create a circular reference
          if (newParent.path.includes(categoryId)) {
            throw new Error(
              "Cannot move category under one of its descendants",
            );
          }

          const newLevel = newParent.level + 1;
          const newPath = [...newParent.path, newParent._id];

          await ctx.db.patch(categoryId, {
            ...baseUpdates,
            slug,
            parentId: parentId,
            level: newLevel,
            path: newPath,
          });

          // Update all children if hierarchy changed
          await updateChildrenPathsAndLevels(
            ctx,
            categoryId,
            newLevel,
            newPath,
          );
        }
      } else {
        // Simple update with slug change
        await ctx.db.patch(categoryId, { ...baseUpdates, slug });
      }
    } else {
      // Handle parent change without name/slug change
      if (parentId !== undefined) {
        if (parentId === null) {
          await ctx.db.patch(categoryId, {
            ...baseUpdates,
            parentId: undefined,
            level: 0,
            path: [],
          });
        } else {
          if (parentId === categoryId) {
            throw new Error("A category cannot be its own parent");
          }

          const newParent = await ctx.db.get(parentId);
          if (!newParent) {
            throw new Error("Parent category not found");
          }

          if (newParent.path.includes(categoryId)) {
            throw new Error(
              "Cannot move category under one of its descendants",
            );
          }

          const newLevel = newParent.level + 1;
          const newPath = [...newParent.path, newParent._id];

          await ctx.db.patch(categoryId, {
            ...baseUpdates,
            parentId: parentId,
            level: newLevel,
            path: newPath,
          });

          await updateChildrenPathsAndLevels(
            ctx,
            categoryId,
            newLevel,
            newPath,
          );
        }
      } else {
        // Simple update without hierarchy change
        await ctx.db.patch(categoryId, baseUpdates);
      }
    }
  },
});

/**
 * Delete a category and all its children
 */
export const deleteCategory = mutation({
  args: { categoryId: v.id("productCategories") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Recursive function to delete category and all children
    const deleteCategoryAndChildren = async (
      catId: Id<"productCategories">,
    ) => {
      // Find all children first
      const children = await ctx.db
        .query("productCategories")
        .withIndex("by_parent", (q) => q.eq("parentId", catId))
        .collect();

      // Recursively delete all children
      for (const child of children) {
        await deleteCategoryAndChildren(child._id);
      }

      // Delete the category itself
      await ctx.db.delete(catId);
    };

    await deleteCategoryAndChildren(args.categoryId);
  },
});
