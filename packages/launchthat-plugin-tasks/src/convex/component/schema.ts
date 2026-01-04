import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const taskBoardsTable = defineTable({
  name: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_name", ["name"]);

const tasksTable = defineTable({
  title: v.string(),
  description: v.optional(v.string()),
  dueDate: v.optional(v.number()),
  isRecurring: v.optional(v.boolean()),
  recurrenceRule: v.optional(v.string()),
  status: v.union(
    v.literal("pending"),
    v.literal("completed"),
    v.literal("cancelled"),
  ),
  createdAt: v.number(),
  updatedAt: v.number(),
  boardId: v.optional(v.id("taskBoards")),
  sortIndex: v.optional(v.number()),
})
  .index("by_boardId_and_sortIndex", ["boardId", "sortIndex"])
  .index("by_sortIndex", ["sortIndex"]);

export default defineSchema({
  tasks: tasksTable,
  taskBoards: taskBoardsTable,
});



