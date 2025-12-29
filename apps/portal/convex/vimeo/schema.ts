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
  // Soft-delete support so we can retain references even if the video is removed on Vimeo
  status: v.union(v.literal("active"), v.literal("deleted")),
  deletedAt: v.optional(v.number()),
  // When we last confirmed this row against Vimeo (webhook or backstop sync)
  lastSyncedAt: v.optional(v.number()),
  // Link back to owning integration connection for traceability
  connectionId: v.id("connections"),
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_videoId", ["videoId"]) // to quickly upsert based on Vimeo id
  .index("by_connection", ["connectionId"])
  .index("by_connection_and_status", ["connectionId", "status"])
  .index("by_connection_and_videoId", ["connectionId", "videoId"])
  .searchIndex("search_title", {
    searchField: "title",
    filterFields: ["connectionId", "status"],
  });

export const vimeoSyncStateTable = defineTable({
  connectionId: v.id("connections"),
  status: v.union(
    v.literal("idle"),
    v.literal("running"),
    v.literal("error"),
    v.literal("done"),
  ),
  nextPage: v.number(),
  perPage: v.number(),
  syncedCount: v.number(),
  pagesFetched: v.number(),
  totalVideos: v.optional(v.number()),
  estimatedTotalPages: v.optional(v.number()),
  workflowId: v.optional(v.string()),
  lastError: v.optional(v.string()),
  startedAt: v.optional(v.number()),
  finishedAt: v.optional(v.number()),
  // Webhook subscription (per connection)
  webhookSecret: v.optional(v.string()),
  webhookId: v.optional(v.string()),
  webhookStatus: v.optional(
    v.union(
      v.literal("idle"),
      v.literal("active"),
      v.literal("error"),
      v.literal("disabled"),
    ),
  ),
  webhookLastEventAt: v.optional(v.number()),
  webhookLastError: v.optional(v.string()),
  updatedAt: v.number(),
}).index("by_connectionId", ["connectionId"]);

export const vimeoSchema = {
  vimeoVideos: vimeoVideosTable,
  vimeoSyncState: vimeoSyncStateTable,
};
