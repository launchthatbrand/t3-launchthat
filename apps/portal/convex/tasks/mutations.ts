import { v } from "convex/values";

import { mutation } from "../_generated/server";
import { components } from "../_generated/api";

// Narrow overly deep types from generated bindings to keep TS fast/stable.
const tasksMutations = components.launchthat_tasks.tasks.mutations as any;

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
    boardId: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const id = await ctx.runMutation(tasksMutations.createTask, args);
    return String(id);
  },
});

// --- Update Task Mutation ---
export const updateTask = mutation({
  args: {
    taskId: v.string(),
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
  returns: v.boolean(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(tasksMutations.updateTask, args);
  },
});

// --- Delete Task Mutation ---
export const deleteTask = mutation({
  args: { taskId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(tasksMutations.deleteTask, args);
  },
});

// --- Reorder Tasks Mutation ---
export const reorderTasks = mutation({
  args: {
    tasks: v.array(
      v.object({
        taskId: v.string(),
        sortIndex: v.number(),
      }),
    ),
  },
  returns: v.boolean(),
  handler: async (ctx, { tasks }) => {
    return await ctx.runMutation(tasksMutations.reorderTasks, { tasks });
  },
});
