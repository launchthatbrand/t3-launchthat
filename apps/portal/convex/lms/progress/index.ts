import { filter } from "convex-helpers/server/filter";
import { v } from "convex/values";

import type { Doc, Id } from "../../_generated/dataModel";
import { mutation, query } from "../../_generated/server";
import { requireAdmin } from "../../lib/permissions/requirePermission";

// --- Mark Item as Complete ---
export const markComplete = mutation({
  args: {
    userId: v.id("users"),
    courseId: v.id("courses"),
    itemId: v.union(v.id("topics"), v.id("quizzes")),
    itemType: v.union(v.literal("topic"), v.literal("quiz")),
    score: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if progress record already exists
    const existingProgress = await filter(
      ctx.db.query("progress"),
      (progress: Doc<"progress">) =>
        progress.userId === args.userId && progress.itemId === args.itemId,
    ).first();

    if (existingProgress) {
      // Update existing record
      await ctx.db.patch(existingProgress._id, {
        completed: true,
        completedAt: Date.now(),
        score: args.score,
        attempts: (existingProgress.attempts ?? 0) + 1,
      });
      return existingProgress._id;
    }

    // Create new progress record
    const progressId = await ctx.db.insert("progress", {
      userId: args.userId,
      courseId: args.courseId,
      itemId: args.itemId,
      itemType: args.itemType,
      completed: true,
      completedAt: Date.now(),
      score: args.score,
      attempts: 1,
    });

    return progressId;
  },
});

// --- Get Item Progress ---
export const getItemProgress = query({
  args: {
    userId: v.id("users"),
    itemId: v.union(v.id("topics"), v.id("quizzes")),
  },
  handler: async (ctx, args) => {
    const progress = await filter(
      ctx.db.query("progress"),
      (progress: Doc<"progress">) =>
        progress.userId === args.userId && progress.itemId === args.itemId,
    ).first();

    return progress ?? null;
  },
});

// --- Reset Progress ---
export const resetProgress = mutation({
  args: {
    userId: v.id("users"),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Get all progress records for this user and course
    const progressRecords = await ctx.db
      .query("progress")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId),
      )
      .collect();

    // Delete all progress records
    for (const record of progressRecords) {
      await ctx.db.delete(record._id);
    }
  },
});

// --- Get Course Progress Summary ---
export const getCourseSummary = query({
  args: {
    userId: v.id("users"),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    // Get all progress records for this user and course
    const progress = await ctx.db
      .query("progress")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId),
      )
      .collect();

    // Calculate summary statistics
    const totalItems = progress.length;
    const completedItems = progress.filter((p) => p.completed).length;
    const percentComplete =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // Calculate quiz statistics
    const quizzes = progress.filter((p) => p.itemType === "quiz");
    const completedQuizzes = quizzes.filter((q) => q.completed);
    const averageScore =
      completedQuizzes.length > 0
        ? completedQuizzes.reduce((sum, q) => sum + (q.score ?? 0), 0) /
          completedQuizzes.length
        : 0;

    return {
      totalItems,
      completedItems,
      percentComplete,
      quizzes: {
        total: quizzes.length,
        completed: completedQuizzes.length,
        averageScore,
      },
    };
  },
});
