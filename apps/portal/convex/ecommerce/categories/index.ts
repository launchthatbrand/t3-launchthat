import { v } from "convex/values";

import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server"; // For updateChildrenPathsAndLevels context
import { mutation, query } from "../../_generated/server";
import { requireAdmin } from "../../lib/permissions/requirePermission";

// Define an interface for category with children for the tree structure
interface CategoryWithChildren extends Doc<"productCategories"> {
  children: CategoryWithChildren[];
}

// Get all product categories
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

    if (args.isActive !== undefined) {
      categories = categories.filter((c) => c.isActive === args.isActive);
    }
    if (args.isVisible !== undefined) {
      categories = categories.filter((c) => c.isVisible === args.isVisible);
    }

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

export const getCategoryTree = query({
  args: {
    isActive: v.optional(v.boolean()),
    isVisible: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let categoriesQuery = ctx.db.query("productCategories");
    if (args.isActive !== undefined) {
      categoriesQuery = categoriesQuery.filter((q) =>
        q.eq(q.field("isActive"), args.isActive === true),
      );
    }
    if (args.isVisible !== undefined) {
      categoriesQuery = categoriesQuery.filter((q) =>
        q.eq(q.field("isVisible"), args.isVisible === true),
      );
    }
    const allCategories: Doc<"productCategories">[] =
      await categoriesQuery.collect();
    const categoriesById = new Map<
      Id<"productCategories">,
      CategoryWithChildren
    >();

    allCategories.forEach((catDoc: Doc<"productCategories">) => {
      categoriesById.set(catDoc._id, {
        ...catDoc,
        children: [],
      });
    });

    const rootCategories: CategoryWithChildren[] = [];
    allCategories.forEach((categoryDoc) => {
      const categoryWithChildren = categoriesById.get(categoryDoc._id);
      if (!categoryWithChildren) return;

      if (categoryDoc.parentId && categoriesById.has(categoryDoc.parentId)) {
        const parent = categoriesById.get(categoryDoc.parentId);
        if (parent) {
          parent.children.push(categoryWithChildren);
        } else {
          rootCategories.push(categoryWithChildren);
        }
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    const sortCategoriesRecursive = (
      categoriesToSort: CategoryWithChildren[],
    ) => {
      categoriesToSort.sort((a, b) => {
        if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
          return a.displayOrder - b.displayOrder;
        }
        if (a.displayOrder !== undefined) return -1;
        if (b.displayOrder !== undefined) return 1;
        return a.name.localeCompare(b.name);
      });
      categoriesToSort.forEach((cat) => {
        if (cat.children.length > 0) {
          sortCategoriesRecursive(cat.children);
        }
      });
    };
    sortCategoriesRecursive(rootCategories);
    return rootCategories;
  },
});

export const getCategory = query({
  args: {
    categoryId: v.id("productCategories"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.categoryId);
  },
});

// Note: getCategoryBySlug is a query function, not a direct DB call utility.
// It should be called via ctx.runQuery from actions/mutations, or used in client-side fetches.
// For internal use within mutations like createCategory/updateCategory, we query directly.
export const getCategoryBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("productCategories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

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
    const baseSlug = args.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    let slug = baseSlug;
    let existingCategory = await ctx.db
      .query("productCategories")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    let suffix = 1;
    while (existingCategory) {
      slug = `${baseSlug}-${suffix}`;
      existingCategory = await ctx.db
        .query("productCategories")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();
      suffix++;
    }

    let level = 0;
    const path: Id<"productCategories">[] = [];
    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (!parent) throw new Error("Parent category not found");
      level = parent.level + 1;
      path.push(...parent.path, parent._id);
    }

    const now = Date.now();
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
      metaKeywords: args.metaKeywords,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateCategory = mutation({
  args: {
    categoryId: v.id("productCategories"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    parentId: v.optional(v.id("productCategories")),
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
    const { categoryId, ...updatesIn } = args;
    const updates: Partial<Doc<"productCategories">> = { ...updatesIn };

    const existingCategoryDoc = await ctx.db.get(categoryId);
    if (!existingCategoryDoc) throw new Error("Category not found");

    if (updates.name && updates.name !== existingCategoryDoc.name) {
      const baseSlug = updates.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      let slug = baseSlug;
      let conflictCategory = await ctx.db
        .query("productCategories")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();
      let suffix = 1;
      while (conflictCategory && conflictCategory._id !== categoryId) {
        slug = `${baseSlug}-${suffix}`;
        conflictCategory = await ctx.db
          .query("productCategories")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .unique();
        suffix++;
      }
      updates.slug = slug;
    }

    if (
      updates.parentId !== undefined &&
      updates.parentId !== existingCategoryDoc.parentId
    ) {
      let newLevel = 0;
      const newPath: Id<"productCategories">[] = [];
      if (updates.parentId) {
        if (updates.parentId === categoryId)
          throw new Error("A category cannot be its own parent.");
        const parent = await ctx.db.get(updates.parentId);
        if (!parent) throw new Error("New parent category not found");
        newLevel = parent.level + 1;
        newPath.push(...parent.path, parent._id);
        if (newPath.includes(categoryId))
          throw new Error(
            "Circular reference: cannot move category under one of its own descendants.",
          );
      }
      updates.level = newLevel;
      updates.path = newPath;
      await updateChildrenPathsAndLevels(ctx, categoryId, newLevel, newPath);
    } else if (
      args.parentId === null &&
      existingCategoryDoc.parentId !== null
    ) {
      updates.level = 0;
      updates.path = [];
      await updateChildrenPathsAndLevels(ctx, categoryId, 0, []);
    }

    await ctx.db.patch(categoryId, { ...updates, updatedAt: Date.now() });
    return { success: true };
  },
});

async function updateChildrenPathsAndLevels(
  ctx: MutationCtx,
  parentIdToUpdateChildrenOf: Id<"productCategories">,
  newParentLevel: number,
  newParentPath: Id<"productCategories">[],
) {
  const children: Doc<"productCategories">[] = await ctx.db
    .query("productCategories")
    .withIndex("by_parent", (q) => q.eq("parentId", parentIdToUpdateChildrenOf))
    .collect();

  for (const child of children) {
    const newChildLevel = newParentLevel + 1;
    const newChildPath = [...newParentPath, parentIdToUpdateChildrenOf];
    await ctx.db.patch(child._id, {
      level: newChildLevel,
      path: newChildPath,
      updatedAt: Date.now(),
    });
    await updateChildrenPathsAndLevels(
      ctx,
      child._id,
      newChildLevel,
      newChildPath,
    );
  }
}

export const deleteCategory = mutation({
  args: {
    categoryId: v.id("productCategories"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const category = await ctx.db.get(args.categoryId);
    if (!category) throw new Error("Category not found");

    const children = await ctx.db
      .query("productCategories")
      .withIndex("by_parent", (q) => q.eq("parentId", args.categoryId))
      .first();

    if (children)
      throw new Error(
        "Cannot delete category with children. Please delete or reassign children first.",
      );

    await ctx.db.delete(args.categoryId);
    return { success: true };
  },
});

export const getCategoryBreadcrumbs = query({
  args: { categoryId: v.id("productCategories") },
  handler: async (ctx, args) => {
    const breadcrumbs: Pick<
      Doc<"productCategories">,
      "_id" | "name" | "slug"
    >[] = [];
    let currentCategoryId: Id<"productCategories"> | undefined =
      args.categoryId;
    while (currentCategoryId) {
      const categoryDoc: Doc<"productCategories"> | null =
        await ctx.db.get(currentCategoryId);
      if (!categoryDoc) break;
      breadcrumbs.unshift({
        _id: categoryDoc._id,
        name: categoryDoc.name,
        slug: categoryDoc.slug,
      });
      currentCategoryId = categoryDoc.parentId;
    }
    return breadcrumbs;
  },
});

export const getCategoryCount = query({
  args: {
    parentId: v.optional(v.id("productCategories")),
    isActive: v.optional(v.boolean()),
    isVisible: v.optional(v.boolean()),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    let categoriesQuery;

    if (args.parentId !== undefined) {
      categoriesQuery = ctx.db
        .query("productCategories")
        .withIndex("by_parent", (q) => q.eq("parentId", args.parentId));
    } else {
      categoriesQuery = ctx.db.query("productCategories");
    }

    if (args.isActive !== undefined) {
      categoriesQuery = categoriesQuery.filter((q) =>
        q.eq(q.field("isActive"), args.isActive),
      );
    }

    if (args.isVisible !== undefined) {
      categoriesQuery = categoriesQuery.filter((q) =>
        q.eq(q.field("isVisible"), args.isVisible),
      );
    }

    const results = await categoriesQuery.collect();
    return results.length;
  },
});
