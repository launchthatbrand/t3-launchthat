import { defineTable } from "convex/server";
import { v } from "convex/values";

export const taskBoardsSchema = {
  taskBoards: defineTable({
    name: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
};
