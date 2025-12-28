import { defineTable } from "convex/server";
import { v } from "convex/values";

const mediaItemMetaValueValidator = v.union(
  v.string(),
  v.number(),
  v.boolean(),
  v.null(),
);

export const mediaSchema = {
  // Media Items table (metadata for Convex storage files and external URLs)
  mediaItems: defineTable({
    // Organization scope (when set, this media item belongs to that org)
    organizationId: v.optional(v.id("organizations")),

    // Storage reference (for Convex-hosted files)
    storageId: v.optional(v.id("_storage")),

    // External URL (for externally hosted files)
    externalUrl: v.optional(v.string()),

    // Metadata fields
    title: v.optional(v.string()),
    caption: v.optional(v.string()),
    alt: v.optional(v.string()), // Alt text for accessibility

    // Content categorization via taxonomy terms (org-scoped).
    taxonomyTermIds: v.optional(v.array(v.id("taxonomyTerms"))),
    // Legacy field for backward compatibility
    categories: v.optional(v.array(v.string())),
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
    .index("by_organization_and_uploadedAt", ["organizationId", "uploadedAt"])
    .index("by_organization_and_status_and_uploadedAt", [
      "organizationId",
      "status",
      "uploadedAt",
    ])
    .index("by_status", ["status"])
    .index("by_category", ["categories"]) // legacy
    .index("by_taxonomyTermIds", ["taxonomyTermIds"])
    .index("by_uploaded_by", ["uploadedBy"])
    .index("by_uploaded_at", ["uploadedAt"])
    .index("by_status_taxonomyTermIds", ["status", "taxonomyTermIds"]) // composite for combined filter
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

  /**
   * Media item meta (separate from postsMeta).
   *
   * Attachments are backed by `mediaItems`, but we want them to participate in
   * the same metabox/custom-field system as other post types.
   */
  mediaItemsMeta: defineTable({
    organizationId: v.id("organizations"),
    mediaItemId: v.id("mediaItems"),
    key: v.string(),
    value: v.optional(mediaItemMetaValueValidator),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_org_and_mediaItem", ["organizationId", "mediaItemId"])
    .index("by_org_mediaItem_and_key", ["organizationId", "mediaItemId", "key"]),
};
