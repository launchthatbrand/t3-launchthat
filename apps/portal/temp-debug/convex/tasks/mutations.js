import { v } from "convex/values";
import { mutation } from "../_generated/server";
// --- Create Task Mutation ---
export const createTask = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        dueDate: v.optional(v.number()),
        isRecurring: v.optional(v.boolean()),
        recurrenceRule: v.optional(v.string()),
        status: v.optional(v.union(v.literal("pending"), v.literal("completed"), v.literal("cancelled"))),
        boardId: v.optional(v.id("taskBoards")),
    },
    returns: v.id("tasks"),
    handler: async (ctx, args) => {
        const now = Date.now();
        const status = args.status ?? "pending";
        // Find the max sortIndex for the board
        let sortIndex = 0;
        if (args.boardId) {
            const boardTasks = await ctx.db
                .query("tasks")
                .withIndex("by_boardId_and_sortIndex", (q) => q.eq("boardId", args.boardId))
                .order("desc")
                .collect();
            if (boardTasks.length > 0) {
                sortIndex =
                    Math.max(...boardTasks.map((t) => typeof t.sortIndex === "number" ? t.sortIndex : 0)) + 1;
            }
        }
        else {
            // For tasks without a board, just use max of all tasks
            const allTasks = await ctx.db.query("tasks").order("desc").collect();
            if (allTasks.length > 0) {
                sortIndex =
                    Math.max(...allTasks.map((t) => typeof t.sortIndex === "number" ? t.sortIndex : 0)) + 1;
            }
        }
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
            sortIndex,
        });
        return taskId;
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
        status: v.optional(v.union(v.literal("pending"), v.literal("completed"), v.literal("cancelled"))),
    },
    returns: v.boolean(),
    handler: async (ctx, args) => {
        const now = Date.now();
        const updates = { updatedAt: now };
        if (args.title !== undefined)
            updates.title = args.title;
        if (args.description !== undefined)
            updates.description = args.description;
        if (args.dueDate !== undefined)
            updates.dueDate = args.dueDate;
        if (args.isRecurring !== undefined)
            updates.isRecurring = args.isRecurring;
        if (args.recurrenceRule !== undefined)
            updates.recurrenceRule = args.recurrenceRule;
        if (args.status !== undefined)
            updates.status = args.status;
        await ctx.db.patch(args.taskId, updates);
        return true;
    },
});
// --- Delete Task Mutation ---
export const deleteTask = mutation({
    args: { taskId: v.id("tasks") },
    returns: v.boolean(),
    handler: async (ctx, args) => {
        await ctx.db.delete(args.taskId);
        return true;
    },
});
// --- Reorder Tasks Mutation ---
export const reorderTasks = mutation({
    args: {
        tasks: v.array(v.object({
            taskId: v.id("tasks"),
            sortIndex: v.number(),
        })),
    },
    returns: v.boolean(),
    handler: async (ctx, { tasks }) => {
        for (const { taskId, sortIndex } of tasks) {
            await ctx.db.patch(taskId, { sortIndex });
        }
        return true;
    },
});
