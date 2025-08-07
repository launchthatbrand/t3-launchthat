import { filter } from "convex-helpers/server/filter";
import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";
import { internalMutation, mutation } from "../../_generated/server";
import { requireAdmin } from "../../lib/permissions/requirePermission";

// --- Course CRUD Mutations ---

export const createCourse = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    productId: v.optional(v.id("products")),
    isPublished: v.optional(v.boolean()),
  },
  returns: v.id("courses"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const courseId = await ctx.db.insert("courses", {
      title: args.title,
      description: args.description,
      productId: args.productId,
      isPublished: args.isPublished ?? false,
      courseStructure: [],
    });

    return courseId;
  },
});

export const updateCourse = mutation({
  args: {
    courseId: v.id("courses"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    productId: v.optional(v.id("products")),
    isPublished: v.optional(v.boolean()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const { courseId, ...updates } = args;
    const existingCourse = await ctx.db.get(courseId);
    if (!existingCourse) throw new Error("Course not found");

    await ctx.db.patch(courseId, updates);
    return { success: true };
  },
});

export const internalDeleteLessonAndContent = internalMutation({
  args: { lessonId: v.id("lessons") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Delete topics & quizzes linked to lesson
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_lessonId_order", (q) => q.eq("lessonId", args.lessonId))
      .collect();

    for (const topic of topics) {
      const topicQuizzes = await ctx.db
        .query("quizzes")
        .withIndex("by_topicId", (q) => q.eq("topicId", topic._id))
        .collect();
      for (const quiz of topicQuizzes) {
        await ctx.db.delete(quiz._id);
      }
      await ctx.db.delete(topic._id);
    }

    const lessonQuizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_lessonId", (q) => q.eq("lessonId", args.lessonId))
      .collect();
    for (const quiz of lessonQuizzes) {
      await ctx.db.delete(quiz._id);
    }

    const lesson = await ctx.db.get(args.lessonId);
    if (lesson) await ctx.db.delete(args.lessonId);
  },
});

export const deleteCourse = mutation({
  args: { courseId: v.id("courses") },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found and cannot be deleted.");

    if (course.courseStructure && course.courseStructure.length > 0) {
      for (const lessonItem of course.courseStructure) {
        await ctx.scheduler.runAfter(
          0,
          internal.lms.courses.mutations.internalDeleteLessonAndContent,
          { lessonId: lessonItem.lessonId },
        );
      }
    }

    await ctx.db.delete(args.courseId);
    return { success: true };
  },
});

// --- Course Structure Management ---

export const addLessonToCourse = mutation({
  args: { courseId: v.id("courses"), lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    await ctx.db.patch(args.lessonId, { courseId: args.courseId });

    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");

    const exists = course.courseStructure?.some(
      (i) => i.lessonId === args.lessonId,
    );
    if (exists) return null;

    const newStructure = [
      ...(course.courseStructure ?? []),
      { lessonId: args.lessonId },
    ];
    await ctx.db.patch(args.courseId, { courseStructure: newStructure });
    return null;
  },
});

export const removeLessonFromCourseStructure = mutation({
  args: { courseId: v.id("courses"), lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");

    const updated = (course.courseStructure ?? []).filter(
      (i) => i.lessonId !== args.lessonId,
    );
    await ctx.db.patch(args.courseId, { courseStructure: updated });
    await ctx.db.patch(args.lessonId, { courseId: undefined });
  },
});

export const reorderLessonsInCourse = mutation({
  args: {
    courseId: v.id("courses"),
    orderedLessonIds: v.array(v.id("lessons")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const newStructure = args.orderedLessonIds.map((lessonId) => ({
      lessonId,
    }));
    await ctx.db.patch(args.courseId, { courseStructure: newStructure });
    return null;
  },
});

export const updateStructure = mutation({
  args: { courseId: v.id("courses"), lessonIds: v.array(v.id("lessons")) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    await ctx.db.patch(args.courseId, {
      courseStructure: args.lessonIds.map((id) => ({ lessonId: id })),
    });

    for (let i = 0; i < args.lessonIds.length; i++) {
      await ctx.db.patch(args.lessonIds[i], {
        courseId: args.courseId,
        order: i,
      });
    }
  },
});

export const setFinalQuiz = mutation({
  args: { courseId: v.id("courses"), quizId: v.optional(v.id("quizzes")) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");

    if (course.finalQuizId) {
      await ctx.db.patch(course.finalQuizId, {
        courseId: undefined,
        order: undefined,
      });
    }

    await ctx.db.patch(args.courseId, { finalQuizId: args.quizId });

    if (args.quizId) {
      await ctx.db.patch(args.quizId, { courseId: args.courseId, order: 0 });
    }
  },
});

export const removeLesson = mutation({
  args: { courseId: v.id("courses"), lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");

    const newStructure = (course.courseStructure ?? []).filter(
      (i) => i.lessonId !== args.lessonId,
    );
    await ctx.db.patch(args.courseId, { courseStructure: newStructure });
    await ctx.db.patch(args.lessonId, {
      courseId: undefined,
      order: undefined,
    });
  },
});

export const saveCourseStructure = mutation({
  args: {
    courseId: v.id("courses"),
    structure: v.object({
      lessons: v.array(v.object({ lessonId: v.id("lessons") })),
    }),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");

    const currentLessonIds = new Set(
      (course.courseStructure ?? []).map((i) => i.lessonId),
    );
    const newLessonIds = new Set(args.structure.lessons.map((i) => i.lessonId));

    for (const id of currentLessonIds) {
      if (!newLessonIds.has(id)) {
        await ctx.db.patch(id, { courseId: undefined, order: undefined });
      }
    }

    for (let i = 0; i < args.structure.lessons.length; i++) {
      await ctx.db.patch(args.structure.lessons[i].lessonId, {
        courseId: args.courseId,
        order: i,
      });
    }

    await ctx.db.patch(args.courseId, {
      courseStructure: args.structure.lessons,
    });
    return { success: true };
  },
});
