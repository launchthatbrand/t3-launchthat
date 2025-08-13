import { v } from "convex/values";

import { mutation } from "../../_generated/server";

export const createBoard = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const now = Date.now();
    return await ctx.db.insert("taskBoards", {
      name,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateBoard = mutation({
  args: { boardId: v.id("taskBoards"), name: v.string() },
  handler: async (ctx, { boardId, name }) => {
    const now = Date.now();
    await ctx.db.patch(boardId, { name, updatedAt: now });
    return true;
  },
});

export const deleteBoard = mutation({
  args: { boardId: v.id("taskBoards") },
  handler: async (ctx, { boardId }) => {
    await ctx.db.delete(boardId);
    return true;
  },
});
