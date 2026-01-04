import { v } from "convex/values";

import { mutation } from "../../_generated/server";
import { components } from "../../_generated/api";

// Narrow overly deep types from generated bindings to keep TS fast/stable.
const boardsMutations = components.launchthat_tasks.tasks.boards.mutations as any;

export const createBoard = mutation({
  args: { name: v.string() },
  returns: v.string(),
  handler: async (ctx, { name }) => {
    const id = await ctx.runMutation(boardsMutations.createBoard, { name });
    return String(id);
  },
});

export const updateBoard = mutation({
  args: { boardId: v.string(), name: v.string() },
  returns: v.boolean(),
  handler: async (ctx, { boardId, name }) => {
    return await ctx.runMutation(boardsMutations.updateBoard, { boardId, name });
  },
});

export const deleteBoard = mutation({
  args: { boardId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, { boardId }) => {
    return await ctx.runMutation(boardsMutations.deleteBoard, { boardId });
  },
});
