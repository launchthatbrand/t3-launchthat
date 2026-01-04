import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Component-scoped table for Vimeo videos synced into the media library.
//
// NOTE: We store `connectionId` as a string since the portal owns the integrations tables
// in its main deployment (component ids can't validate as v.id("connections") here).
const vimeoVideosTable = defineTable({
  videoId: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  embedUrl: v.string(),
  thumbnailUrl: v.optional(v.string()),
  publishedAt: v.number(),
  status: v.union(v.literal("active"), v.literal("deleted")),
  deletedAt: v.optional(v.number()),
  lastSyncedAt: v.optional(v.number()),
  connectionId: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_videoId", ["videoId"])
  .index("by_connection", ["connectionId"])
  .index("by_connection_and_status", ["connectionId", "status"])
  .index("by_connection_and_videoId", ["connectionId", "videoId"])
  .searchIndex("search_title", {
    searchField: "title",
    filterFields: ["connectionId", "status"],
  });

const vimeoSyncStateTable = defineTable({
  connectionId: v.string(),
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

export default defineSchema({
  vimeoVideos: vimeoVideosTable,
  vimeoSyncState: vimeoSyncStateTable,
});



