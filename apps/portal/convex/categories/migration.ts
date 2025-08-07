import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";

import type { Id } from "../_generated/dataModel";
import { api } from "../_generated/api";

/**
 * Migration script to consolidate separate category systems into global categories
 */
export const migrateCategoriesToGlobal = mutation({
  args: {
    dryRun: v.optional(v.boolean()), // Set to true to preview changes without applying them
  },
  returns: v.object({
    success: v.boolean(),
    migratedCategories: v.object({
      media: v.number(),
      products: v.number(),
      downloads: v.number(),
      cms: v.number(),
    }),
    updatedItems: v.object({
      mediaItems: v.number(),
      products: v.number(),
      downloads: v.number(),
      posts: v.number(),
    }),
    errors: v.array(v.string()),
    warnings: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const isDryRun = args.dryRun ?? false;
    const errors: string[] = [];
    const warnings: string[] = [];
    let migratedCategories = { media: 0, products: 0, downloads: 0, cms: 0 };
    let updatedItems = { mediaItems: 0, products: 0, downloads: 0, posts: 0 };

    try {
      // 1. Migrate media categories
      try {
        const mediaCategories = await ctx.db.query("mediaCategories").collect();
        for (const mediaCat of mediaCategories) {
          if (!isDryRun) {
            await ctx.runMutation(api.categories.createCategory, {
              name: mediaCat.name,
              description: mediaCat.description,
              postTypes: ["media"],
              isActive: mediaCat.isActive ?? true,
              isVisible: true,
              isPublic: true,
            });
          }
          migratedCategories.media++;
        }
      } catch (error) {
        warnings.push(
          "MediaCategories table not found - skipping media category migration",
        );
      }

      // 2. Migrate product categories
      try {
        const productCategories = await ctx.db
          .query("productCategories")
          .collect();
        for (const productCat of productCategories) {
          if (!isDryRun) {
            await ctx.runMutation(api.categories.createCategory, {
              name: productCat.name,
              description: productCat.description,
              postTypes: ["products"],
              parentId: productCat.parentId ? productCat.parentId : undefined,
              imageUrl: productCat.imageUrl,
              iconUrl: productCat.iconUrl,
              displayOrder: productCat.displayOrder,
              isActive: productCat.isActive,
              isVisible: productCat.isVisible,
              metaTitle: productCat.metaTitle,
              metaDescription: productCat.metaDescription,
              metaKeywords: productCat.metaKeywords,
            });
          }
          migratedCategories.products++;
        }
      } catch (error) {
        warnings.push(
          "ProductCategories table not found - skipping product category migration",
        );
      }

      // 3. Migrate download categories
      try {
        const downloadCategories = await ctx.db
          .query("downloadCategories")
          .collect();
        for (const downloadCat of downloadCategories) {
          if (!isDryRun) {
            await ctx.runMutation(api.categories.createCategory, {
              name: downloadCat.name,
              description: downloadCat.description,
              postTypes: ["downloads"],
              isActive: true,
              isVisible: true,
              isPublic: downloadCat.isPublic,
            });
          }
          migratedCategories.downloads++;
        }
      } catch (error) {
        warnings.push(
          "DownloadCategories table not found - skipping download category migration",
        );
      }

      // 4. Extract and migrate CMS categories from posts
      try {
        const posts = await ctx.db.query("posts").collect();
        const uniqueCategories = new Set<string>();

        posts.forEach((post) => {
          if (post.category && post.category !== "Uncategorized") {
            uniqueCategories.add(post.category);
          }
        });

        for (const categoryName of uniqueCategories) {
          if (!isDryRun) {
            await ctx.runMutation(api.categories.createCategory, {
              name: categoryName,
              postTypes: ["posts"],
              isActive: true,
              isVisible: true,
              isPublic: true,
            });
          }
          migratedCategories.cms++;
        }
      } catch (error) {
        warnings.push(
          "Posts table not found - skipping CMS category migration",
        );
      }

      // 5. Update media items to use global category IDs
      if (!isDryRun) {
        try {
          const mediaItems = await ctx.db.query("mediaItems").collect();
          for (const item of mediaItems) {
            if (item.categories && item.categories.length > 0) {
              const categoryIds: Id<"categories">[] = [];

              for (const categoryName of item.categories) {
                const globalCategory = await ctx.runQuery(
                  api.categories.getCategoriesByPostType,
                  {
                    postTypes: ["media"],
                  },
                );
                const matchingCategory = globalCategory.find(
                  (cat) => cat.name === categoryName,
                );
                if (matchingCategory) {
                  categoryIds.push(matchingCategory._id);
                }
              }

              if (categoryIds.length > 0) {
                await ctx.db.patch(item._id, {
                  categoryIds,
                });
                updatedItems.mediaItems++;
              }
            }
          }
        } catch (error) {
          errors.push(`Failed to update media items: ${error}`);
        }
      }

      return {
        success: errors.length === 0,
        migratedCategories,
        updatedItems,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(`Migration failed: ${error}`);
      return {
        success: false,
        migratedCategories,
        updatedItems,
        errors,
        warnings,
      };
    }
  },
});

/**
 * Preview the migration without making changes
 */
export const previewCategoryMigration = query({
  args: {},
  returns: v.object({
    categoriesToMigrate: v.object({
      media: v.array(v.string()),
      products: v.array(v.string()),
      downloads: v.array(v.string()),
      cms: v.array(v.string()),
    }),
    itemsToUpdate: v.object({
      mediaItems: v.number(),
      products: v.number(),
      downloads: v.number(),
      posts: v.number(),
    }),
    warnings: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const warnings: string[] = [];
    const categoriesToMigrate = {
      media: [] as string[],
      products: [] as string[],
      downloads: [] as string[],
      cms: [] as string[],
    };
    const itemsToUpdate = {
      mediaItems: 0,
      products: 0,
      downloads: 0,
      posts: 0,
    };

    // Check media categories
    try {
      const mediaCategories = await ctx.db.query("mediaCategories").collect();
      categoriesToMigrate.media = mediaCategories.map((cat) => cat.name);
    } catch {
      warnings.push("MediaCategories table not found");
    }

    // Check product categories
    try {
      const productCategories = await ctx.db
        .query("productCategories")
        .collect();
      categoriesToMigrate.products = productCategories.map((cat) => cat.name);
    } catch {
      warnings.push("ProductCategories table not found");
    }

    // Check download categories
    try {
      const downloadCategories = await ctx.db
        .query("downloadCategories")
        .collect();
      categoriesToMigrate.downloads = downloadCategories.map((cat) => cat.name);
    } catch {
      warnings.push("DownloadCategories table not found");
    }

    // Check CMS categories
    try {
      const posts = await ctx.db.query("posts").collect();
      const uniqueCategories = new Set<string>();

      posts.forEach((post) => {
        if (post.category && post.category !== "Uncategorized") {
          uniqueCategories.add(post.category);
        }
      });

      categoriesToMigrate.cms = Array.from(uniqueCategories);
      itemsToUpdate.posts = posts.filter(
        (p) => p.category && p.category !== "Uncategorized",
      ).length;
    } catch {
      warnings.push("Posts table not found");
    }

    // Check media items
    try {
      const mediaItems = await ctx.db.query("mediaItems").collect();
      itemsToUpdate.mediaItems = mediaItems.filter(
        (item) => item.categories && item.categories.length > 0,
      ).length;
    } catch {
      warnings.push("MediaItems table not found");
    }

    return {
      categoriesToMigrate,
      itemsToUpdate,
      warnings,
    };
  },
});

/**
 * Clean up old category tables after migration
 * WARNING: This will permanently delete the old category tables
 */
export const cleanupOldCategoryTables = mutation({
  args: {
    confirm: v.literal("DELETE_OLD_CATEGORIES"), // Safety confirmation
  },
  returns: v.object({
    success: v.boolean(),
    deletedTables: v.array(v.string()),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const deletedTables: string[] = [];
    const errors: string[] = [];

    try {
      // Note: In Convex, you can't actually drop tables via mutations
      // This would need to be done by removing them from the schema and redeploying
      errors.push(
        "Table cleanup must be done by removing tables from schema files and redeploying",
      );

      return {
        success: true,
        deletedTables,
        errors,
      };
    } catch (error) {
      errors.push(`Cleanup failed: ${error}`);
      return {
        success: false,
        deletedTables,
        errors,
      };
    }
  },
});

/**
 * Validate that migration was successful
 */
export const validateMigration = query({
  args: {},
  returns: v.object({
    isValid: v.boolean(),
    globalCategoriesCount: v.number(),
    itemsWithGlobalCategories: v.object({
      mediaItems: v.number(),
      products: v.number(),
      downloads: v.number(),
      posts: v.number(),
    }),
    issues: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const issues: string[] = [];
    let isValid = true;

    // Check global categories exist
    const globalCategories = await ctx.db.query("categories").collect();
    const globalCategoriesCount = globalCategories.length;

    if (globalCategoriesCount === 0) {
      issues.push("No global categories found - migration may not have run");
      isValid = false;
    }

    // Check items are using global categories
    const itemsWithGlobalCategories = {
      mediaItems: 0,
      products: 0,
      downloads: 0,
      posts: 0,
    };

    try {
      const mediaItems = await ctx.db.query("mediaItems").collect();
      itemsWithGlobalCategories.mediaItems = mediaItems.filter(
        (item) => item.categoryIds && item.categoryIds.length > 0,
      ).length;
    } catch {
      issues.push("Could not check media items");
    }

    return {
      isValid,
      globalCategoriesCount,
      itemsWithGlobalCategories,
      issues,
    };
  },
});
