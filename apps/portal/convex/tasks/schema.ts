import { defineTable } from "convex/server";
import { v } from "convex/values";

export const tasksSchema = {
  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()), // Unix timestamp (ms)
    isRecurring: v.optional(v.boolean()),
    recurrenceRule: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    createdAt: v.number(), // Unix timestamp (ms)
    updatedAt: v.number(), // Unix timestamp (ms)
    boardId: v.optional(v.id("taskBoards")),
  }),
};
