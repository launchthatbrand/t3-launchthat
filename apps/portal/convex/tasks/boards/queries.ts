import type { Id } from "../../_generated/dataModel";
import { query } from "../../_generated/server";
import { v } from "convex/values";

export const listBoards = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("taskBoards").order("desc").collect();
  },
});

export const getBoard = query({
  args: { boardId: v.id("taskBoards") },
  handler: async (ctx, { boardId }) => {
    return await ctx.db.get(boardId);
  },
});
