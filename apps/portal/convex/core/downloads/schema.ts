import { defineTable } from "convex/server";
import { v } from "convex/values";

export const downloadsTable = defineTable({
  organizationId: v.id("organizations"),
  slug: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  // Mirrors `posts.content` so Downloads can use the standard editor template.
  content: v.optional(v.string()),

  mediaItemId: v.id("mediaItems"),
  // Set on publish after copying bytes into R2.
  r2Key: v.optional(v.string()),

  source: v.object({
    kind: v.literal("mediaItem"),
  }),

  access: v.object({
    kind: v.union(v.literal("public"), v.literal("gated")),
  }),

  status: v.union(v.literal("draft"), v.literal("published")),

  downloadCountTotal: v.number(),

  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index("by_org_and_slug", ["organizationId", "slug"])
  .index("by_org_and_mediaItemId", ["organizationId", "mediaItemId"])
  .index("by_org_and_status", ["organizationId", "status"]);

export const downloadEventsTable = defineTable({
  organizationId: v.id("organizations"),
  downloadId: v.id("downloads"),
  createdAt: v.number(),
}).index("by_org_and_download", ["organizationId", "downloadId"]);

const downloadMetaValueValidator = v.union(
  v.string(),
  v.number(),
  v.boolean(),
  v.null(),
);

/**
 * Download meta (separate from postsMeta).
 *
 * This lets Downloads participate in the same metabox/custom-field system
 * without being stored in the `posts` table.
 */
export const downloadsMetaTable = defineTable({
  organizationId: v.id("organizations"),
  downloadId: v.id("downloads"),
  key: v.string(),
  value: v.optional(downloadMetaValueValidator),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index("by_org_and_download", ["organizationId", "downloadId"])
  .index("by_org_download_and_key", ["organizationId", "downloadId", "key"]);

export const downloadsSchema = {
  downloads: downloadsTable,
  downloadEvents: downloadEventsTable,
  downloadsMeta: downloadsMetaTable,
};


