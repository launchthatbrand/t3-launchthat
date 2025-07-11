import { mutation, query } from "../_generated/server";

import type { Id } from "../_generated/dataModel";
import { v } from "convex/values";

// --- Create Task Mutation ---
export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    isRecurring: v.optional(v.boolean()),
    recurrenceRule: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("completed"),
        v.literal("cancelled"),
      ),
    ),
    boardId: v.optional(v.id("taskBoards")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const status = args.status ?? "pending";
    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      dueDate: args.dueDate,
      isRecurring: args.isRecurring,
      recurrenceRule: args.recurrenceRule,
      status,
      createdAt: now,
      updatedAt: now,
      boardId: args.boardId,
    });
    return taskId;
  },
});

// --- List Tasks Query ---
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
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db.query("tasks").order("desc").collect();
  },
});

// --- Get Task Query ---
export const getTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    return task ?? undefined;
  },
});

// --- Update Task Mutation ---
export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    isRecurring: v.optional(v.boolean()),
    recurrenceRule: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("completed"),
        v.literal("cancelled"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const updates: Record<string, unknown> = { updatedAt: now };
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.dueDate !== undefined) updates.dueDate = args.dueDate;
    if (args.isRecurring !== undefined) updates.isRecurring = args.isRecurring;
    if (args.recurrenceRule !== undefined)
      updates.recurrenceRule = args.recurrenceRule;
    if (args.status !== undefined) updates.status = args.status;
    await ctx.db.patch(args.taskId, updates);
    return true;
  },
});

// --- Delete Task Mutation ---
export const deleteTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.taskId);
    return true;
  },
});

export const listTasksByBoard = query({
  args: { boardId: v.id("taskBoards") },
  handler: async (ctx, { boardId }) => {
    const allTasks = (await ctx.db.query("tasks").order("desc").collect()) as {
      boardId?: Id<"taskBoards">;
    }[];
    return allTasks.filter((task) => task.boardId === boardId);
  },
});
