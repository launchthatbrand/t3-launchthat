import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const mediaSchema = defineSchema({
  // Media Items table (metadata for Convex storage files)
  mediaItems: defineTable({
    storageId: v.optional(v.id("_storage")),
    externalUrl: v.optional(v.string()),
    title: v.optional(v.string()),
    caption: v.optional(v.string()),
    alt: v.optional(v.string()),
    categories: v.optional(v.array(v.string())),
    featuredImage: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  }).index("by_storage", ["storageId"]),
});
