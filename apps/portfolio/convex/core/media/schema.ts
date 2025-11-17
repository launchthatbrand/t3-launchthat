import { defineTable } from "convex/server";
import { v } from "convex/values";

export const mediaSchema = {
  // Media Items table (metadata for Convex storage files and external URLs)
  mediaItems: defineTable({
    // Storage reference (for Convex-hosted files)
    storageId: v.optional(v.id("_storage")),

    // External URL (for externally hosted files)
    externalUrl: v.optional(v.string()),

    // Metadata fields
    title: v.optional(v.string()),
    caption: v.optional(v.string()),
    alt: v.optional(v.string()), // Alt text for accessibility

    // Organization - using global categories now
    categoryIds: v.optional(v.array(v.id("categories"))), // New global category references
    categories: v.optional(v.array(v.string())), // Legacy field for backward compatibility
    tags: v.optional(v.array(v.string())),

    // Status and workflow
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),

    // File information (automatically extracted for storage files)
    mimeType: v.optional(v.string()),
    fileSize: v.optional(v.number()),

    // Image-specific metadata
    width: v.optional(v.number()),
    height: v.optional(v.number()),

    // Legacy field for backward compatibility
    featuredImage: v.optional(v.string()),

    // Audit fields
    uploadedBy: v.optional(v.id("users")),
    uploadedAt: v.optional(v.number()),
  })
    .index("by_storage", ["storageId"])
    .index("by_status", ["status"])
    .index("by_category", ["categories"]) // legacy
    .index("by_categoryIds", ["categoryIds"]) // new global categories
    .index("by_uploaded_by", ["uploadedBy"])
    .index("by_uploaded_at", ["uploadedAt"])
    .index("by_status_categoryIds", ["status", "categoryIds"]) // composite for combined filter
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["status"],
    })
    .searchIndex("search_caption", {
      searchField: "caption",
      filterFields: ["status"],
    })
    .searchIndex("search_alt", {
      searchField: "alt",
      filterFields: ["status"],
    }),
};
