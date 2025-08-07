/**
 * Schema definitions for the Downloads module
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Downloads table for storing file metadata
 */
export const downloads = defineTable({
  title: v.string(),
  description: v.optional(v.string()),
  fileName: v.string(),
  fileExtension: v.optional(v.string()),
  fileType: v.string(),
  fileSize: v.number(),
  storageId: v.id("_storage"),
  featuredImageId: v.optional(v.id("_storage")),
  searchText: v.string(),
  categoryId: v.optional(v.id("downloadCategories")),
  tags: v.optional(v.array(v.string())),
  downloadCount: v.number(),
  isPublic: v.boolean(),
  requiredProductId: v.optional(v.id("products")),
  requiredCourseId: v.optional(v.id("courses")),
  accessibleUserIds: v.optional(v.array(v.id("users"))),
  uploadedBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_category", ["categoryId"])
  .index("by_uploader", ["uploadedBy"])
  .index("by_product", ["requiredProductId"])
  .index("by_course", ["requiredCourseId"])
  .index("by_public", ["isPublic"])
  .index("by_created", ["createdAt"])
  .searchIndex("search_downloads", {
    searchField: "searchText",
    filterFields: ["categoryId", "fileType", "isPublic"],
  });

/**
 * Download categories for organizing files
 */
export const downloadCategories = defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  isPublic: v.boolean(),
  createdAt: v.number(),
})
  .index("by_public", ["isPublic"])
  .index("by_created", ["createdAt"]);

/**
 * User download history for tracking which files have been downloaded
 */
export const userDownloads = defineTable({
  userId: v.id("users"),
  downloadId: v.id("downloads"),
  downloadedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_download", ["downloadId"])
  .index("by_user_download", ["userId", "downloadId"])
  .index("by_download_date", ["downloadedAt"]);

/**
 * Download likes/favorites for implementing user favorites functionality
 */
export const downloadFavorites = defineTable({
  userId: v.id("users"),
  downloadId: v.id("downloads"),
  favoriteAddedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_download", ["downloadId"])
  .index("by_user_download", ["userId", "downloadId"]);

/**
 * Export all tables using defineSchema for importing into the main schema
 */
export const downloadsSchema = defineSchema({
  downloads,
  downloadCategories,
  userDownloads,
  downloadFavorites,
});
