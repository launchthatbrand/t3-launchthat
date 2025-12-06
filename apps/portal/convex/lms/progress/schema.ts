import { defineTable } from "convex/server";
import { v } from "convex/values";

export const courseProgressTable = defineTable({
  organizationId: v.optional(v.id("organizations")),
  userId: v.id("users"),
  courseId: v.id("posts"),
  completedLessonIds: v.array(v.id("posts")),
  completedTopicIds: v.array(v.id("posts")),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  updatedAt: v.number(),
  lastAccessedAt: v.optional(v.number()),
  lastAccessedId: v.optional(v.id("posts")),
  lastAccessedType: v.optional(
    v.union(v.literal("lesson"), v.literal("topic")),
  ),
})
  .index("by_user", ["userId"])
  .index("by_course", ["courseId"])
  .index("by_user_course", ["userId", "courseId"]);

export const progressSchema = {
  courseProgress: courseProgressTable,
};
