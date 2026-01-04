import { v } from "convex/values";

import { query } from "../_generated/server";

export const listTasks = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("tasks"),
      _creationTime: v.number(),
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
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_sortIndex")
      .order("asc")
      .collect();
  },
});

export const getTask = query({
  args: { taskId: v.id("tasks") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("tasks"),
      _creationTime: v.number(),
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
    }),
  ),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    return task ?? null;
  },
});

export const listTasksByBoard = query({
  args: { boardId: v.id("taskBoards") },
  returns: v.array(
    v.object({
      _id: v.id("tasks"),
      _creationTime: v.number(),
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
    }),
  ),
  handler: async (ctx, { boardId }) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_boardId_and_sortIndex", (q) => q.eq("boardId", boardId))
      .collect();
  },
});



