import { defineTable } from "convex/server";
import { v } from "convex/values";

// Table for Vimeo videos that have been synced into the portal media library
export const vimeoVideosTable = defineTable({
  // Vimeo video URI or id (e.g. "/videos/123456789")
  videoId: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  embedUrl: v.string(),
  thumbnailUrl: v.optional(v.string()),
  publishedAt: v.number(),
  // Link back to owning integration connection for traceability
  connectionId: v.id("connections"),
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_videoId", ["videoId"]) // to quickly upsert based on Vimeo id
  .index("by_connection", ["connectionId"]);

export const vimeoSchema = {
  vimeoVideos: vimeoVideosTable,
};
