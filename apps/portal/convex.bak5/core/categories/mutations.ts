import { ConvexError, v } from "convex/values";

import { Id } from "../../_generated/dataModel";
import { mutation } from "../../_generated/server";

/**
 * Generate a URL-friendly slug from a name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim();
}

/**
 * Create a new category with automatic slug generation
 */
export const createCategory = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    postTypes: v.optional(v.array(v.string())),
    parentId: v.optional(v.id("categories")),
    metadata: v.optional(
      v.record(v.string(), v.union(v.string(), v.number(), v.boolean())),
    ),
  },
  returns: v.object({
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
  handler: async (ctx, args) => {
    // Check if authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "unauthorized",
        message: "You must be signed in to create a category",
      });
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      throw new ConvexError({
        code: "not_found",
        message: "User not found",
      });
    }

    // Generate slug from name
    const slug = generateSlug(args.name);

    // Check if a category with this slug already exists
    const existingCategory = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (existingCategory) {
      throw new ConvexError({
        code: "conflict",
        message: `Category with slug "${slug}" already exists`,
      });
    }

    // Validate parent category exists if provided
    if (args.parentId) {
      const parentCategory = await ctx.db.get(args.parentId);
      if (!parentCategory) {
        throw new ConvexError({
          code: "not_found",
          message: "Parent category not found",
        });
      }
    }

    const now = Date.now();

    // Create the category
    const categoryId = await ctx.db.insert("categories", {
      name: args.name,
      slug,
      description: args.description,
      parentId: args.parentId,
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
    });

    // Return the created category
    const category = await ctx.db.get(categoryId);
    if (!category) {
      throw new ConvexError({
        code: "internal_error",
        message: "Failed to retrieve created category",
      });
    }

    return category;
  },
});

/**
 * Update a category
 */
export const updateCategory = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    parentId: v.optional(v.id("categories")),
    postTypes: v.optional(v.array(v.string())),
    metadata: v.optional(
      v.record(v.string(), v.union(v.string(), v.number(), v.boolean())),
    ),
  },
  returns: v.object({
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
  handler: async (ctx, args) => {
    // Check if authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "unauthorized",
        message: "You must be signed in to update a category",
      });
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      throw new ConvexError({
        code: "not_found",
        message: "User not found",
      });
    }

    // Check if category exists
    const existingCategory = await ctx.db.get(args.id);
    if (!existingCategory) {
      throw new ConvexError({
        code: "not_found",
        message: "Category not found",
      });
    }

    // Validate parent category exists if provided
    if (args.parentId) {
      const parentCategory = await ctx.db.get(args.parentId);
      if (!parentCategory) {
        throw new ConvexError({
          code: "not_found",
          message: "Parent category not found",
        });
      }

      // Prevent circular references
      if (args.parentId === args.id) {
        throw new ConvexError({
          code: "invalid_argument",
          message: "Category cannot be its own parent",
        });
      }
    }

    const updateData: Partial<{
      name: string;
      slug: string;
      description?: string;
      parentId?: Id<"categories">;
      metadata?: Record<string, string | number | boolean>;
      updatedAt: number;
    }> = {
      updatedAt: Date.now(),
    };

    // Update name and regenerate slug if name is provided
    if (args.name) {
      const newSlug = generateSlug(args.name);
      updateData.name = args.name;
      updateData.slug = newSlug;

      // Check if new slug conflicts with existing categories (excluding current one)
      const conflictingCategory = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", newSlug))
        .first();

      if (conflictingCategory && conflictingCategory._id !== args.id) {
        throw new ConvexError({
          code: "conflict",
          message: `Category with slug "${newSlug}" already exists`,
        });
      }
    }

    if (args.description !== undefined) {
      updateData.description = args.description;
    }

    if (args.parentId !== undefined) {
      updateData.parentId = args.parentId;
    }

    if (args.metadata !== undefined) {
      updateData.metadata = args.metadata;
    }

    // Update the category
    await ctx.db.patch(args.id, updateData);

    // Return the updated category
    const updatedCategory = await ctx.db.get(args.id);
    if (!updatedCategory) {
      throw new ConvexError({
        code: "internal_error",
        message: "Failed to retrieve updated category",
      });
    }

    return updatedCategory;
  },
});

/**
 * Delete a category
 */
export const deleteCategory = mutation({
  args: {
    id: v.id("categories"),
  },
  returns: v.object({
    success: v.boolean(),
    deletedId: v.id("categories"),
  }),
  handler: async (ctx, args) => {
    // Check if authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "unauthorized",
        message: "You must be signed in to delete a category",
      });
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      throw new ConvexError({
        code: "not_found",
        message: "User not found",
      });
    }

    // Check if category exists
    const category = await ctx.db.get(args.id);
    if (!category) {
      throw new ConvexError({
        code: "not_found",
        message: "Category not found",
      });
    }

    // Check if category has child categories
    const childCategories = await ctx.db
      .query("categories")
      .withIndex("by_parent", (q) => q.eq("parentId", args.id))
      .collect();

    if (childCategories.length > 0) {
      throw new ConvexError({
        code: "conflict",
        message:
          "Cannot delete category with child categories. Delete child categories first.",
      });
    }

    // Note: In a real application, you might also want to check for products
    // that reference this category and handle them appropriately
    // For now, we'll just delete the category

    // Delete the category
    await ctx.db.delete(args.id);

    return {
      success: true,
      deletedId: args.id,
    };
  },
});
