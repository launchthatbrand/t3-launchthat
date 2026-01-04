import { v } from "convex/values";

import { query } from "../../_generated/server";

export const listBoards = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("taskBoards"),
      _creationTime: v.number(),
      name: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db.query("taskBoards").order("desc").collect();
  },
});

export const getBoard = query({
  args: { boardId: v.id("taskBoards") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("taskBoards"),
      _creationTime: v.number(),
      name: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, { boardId }) => {
    return (await ctx.db.get(boardId)) ?? null;
  },
});



