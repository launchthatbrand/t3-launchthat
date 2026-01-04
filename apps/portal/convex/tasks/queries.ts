import { v } from "convex/values";

import { query } from "../_generated/server";
import { components } from "../_generated/api";

// Narrow overly deep types from generated bindings to keep TS fast/stable.
const tasksQueries = components.launchthat_tasks.tasks.queries as any;

// --- List Tasks Query ---
export const listTasks = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await ctx.runQuery(tasksQueries.listTasks, {});
  },
});

// --- Get Task Query ---
export const getTask = query({
  args: { taskId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(tasksQueries.getTask, { taskId: args.taskId });
  },
});

// --- List Tasks by Board Query ---
export const listTasksByBoard = query({
  args: { boardId: v.string() },
  returns: v.any(),
  handler: async (ctx, { boardId }) => {
    return await ctx.runQuery(tasksQueries.listTasksByBoard, { boardId });
  },
});
