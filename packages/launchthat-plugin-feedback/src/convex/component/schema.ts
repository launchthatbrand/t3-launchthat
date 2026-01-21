import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Feedback/forum schema.
 *
 * Component boundary note:
 * - `authorUserId` is stored as a string (app-owned user id).
 * - Board scoping is done via `boardId` (v1 uses a single global board).
 */
export default defineSchema({
  feedbackThreads: defineTable({
    boardId: v.string(),
    authorUserId: v.string(),
    title: v.string(),
    body: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("planned"),
      v.literal("in_progress"),
      v.literal("done"),
      v.literal("closed"),
    ),
    upvoteCount: v.number(),
    commentCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_board_createdAt", ["boardId", "createdAt"])
    .index("by_board_upvoteCount_and_createdAt", ["boardId", "upvoteCount", "createdAt"]),

  feedbackVotes: defineTable({
    threadId: v.id("feedbackThreads"),
    userId: v.string(),
    createdAt: v.number(),
  })
    .index("by_thread_user", ["threadId", "userId"])
    .index("by_user", ["userId"]),

  feedbackComments: defineTable({
    threadId: v.id("feedbackThreads"),
    authorUserId: v.string(),
    body: v.string(),
    createdAt: v.number(),
  }).index("by_thread_createdAt", ["threadId", "createdAt"]),
});

