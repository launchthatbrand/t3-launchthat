import { v } from "convex/values";

import { query } from "../../_generated/server";
import { components } from "../../_generated/api";

// Narrow overly deep types from generated bindings to keep TS fast/stable.
const boardsQueries = components.launchthat_tasks.tasks.boards.queries as any;

export const listBoards = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await ctx.runQuery(boardsQueries.listBoards, {});
  },
});

export const getBoard = query({
  args: { boardId: v.string() },
  returns: v.any(),
  handler: async (ctx, { boardId }) => {
    return await ctx.runQuery(boardsQueries.getBoard, { boardId });
  },
});
