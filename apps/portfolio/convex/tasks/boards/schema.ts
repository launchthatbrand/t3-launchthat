import { defineTable } from "convex/server";
import { v } from "convex/values";

export const taskBoardsTable = defineTable({
  name: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_name", ["name"]);

export const taskBoardsSchema = {
  taskBoards: taskBoardsTable,
};
