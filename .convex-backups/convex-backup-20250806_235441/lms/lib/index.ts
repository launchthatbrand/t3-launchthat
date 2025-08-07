import { filter } from "convex-helpers/server/filter";
import { v } from "convex/values";

import type { Doc, Id, TableNames } from "../../_generated/dataModel";
import { DatabaseReader, mutation, query } from "../../_generated/server";

// Shared LMS lib functions will be moved here
export {};

// --- Get Course Progress ---
export const getCourseProgress = async (
  ctx: DatabaseReader,
  userId: Id<"users">,
  courseId: Id<"courses">,
) => {
  // Get course structure
  const course = await ctx.get(courseId);
  if (!course) {
    throw new Error("Course not found");
  }

  // Get all lessons for this course
  const lessons = await ctx
    .query("lessons")
    .withIndex("by_course_order", (q: any) => q.eq("courseId", courseId))
    .collect();

  // Get all topics for these lessons
  const lessonIds = lessons.map((lesson: Doc<"lessons">) => lesson._id);
  const topics = await filter(ctx.query("topics"), (topic: Doc<"topics">) =>
    lessonIds.includes(topic.lessonId as Id<"lessons">),
  ).collect();

  // Get all quizzes for these topics
  const topicIds = topics.map((topic: Doc<"topics">) => topic._id);
  const quizzes = await filter(ctx.query("quizzes"), (quiz: Doc<"quizzes">) =>
    topicIds.includes(quiz.topicId as Id<"topics">),
  ).collect();

  // Get final quiz if it exists
  const finalQuiz = course.finalQuizId
    ? await ctx.get(course.finalQuizId)
    : null;

  // Get user's progress records
  const progress = await ctx
    .query("progress")
    .withIndex("by_user_course", (q: any) =>
      q.eq("userId", userId).eq("courseId", courseId),
    )
    .collect();

  // Calculate completion percentages
  const totalItems = topics.length + quizzes.length + (finalQuiz ? 1 : 0);
  const completedItems = progress.filter(
    (p: Doc<"progress">) => p.completed,
  ).length;
  const percentComplete =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return {
    course,
    lessons,
    topics,
    quizzes,
    finalQuiz,
    progress,
    percentComplete,
  };
};

// --- Check Course Access ---
export const checkCourseAccess = async (
  ctx: DatabaseReader,
  userId: Id<"users">,
  courseId: Id<"courses">,
) => {
  // Check if user is enrolled
  const enrollment = await filter(
    ctx.query("courseEnrollments"),
    (enrollment: Doc<"courseEnrollments">) =>
      enrollment.userId === userId && enrollment.courseId === courseId,
  ).first();

  if (!enrollment) {
    throw new Error("User is not enrolled in this course");
  }

  // Check if course is published
  const course = await ctx.get(courseId);
  if (!course) {
    throw new Error("Course not found");
  }

  if (!course.isPublished) {
    throw new Error("Course is not published");
  }

  return { course, enrollment };
};

// --- Get Next Item ---
export const getNextItem = async (
  ctx: DatabaseReader,
  userId: Id<"users">,
  courseId: Id<"courses">,
) => {
  const { course, lessons, topics, quizzes, finalQuiz, progress } =
    await getCourseProgress(ctx, userId, courseId);

  // Create a map of all items with their lesson order
  const itemMap = new Map<
    Id<"topics" | "quizzes">,
    { order: number; lessonOrder: number }
  >();

  // Add topics to the map
  topics.forEach((topic: Doc<"topics">) => {
    const lesson = lessons.find((l) => l._id === topic.lessonId);
    if (lesson) {
      itemMap.set(topic._id, {
        order: topic.order ?? 0,
        lessonOrder: lesson.order ?? 0,
      });
    }
  });

  // Add quizzes to the map
  quizzes.forEach((quiz: Doc<"quizzes">) => {
    const lesson = lessons.find((l) => l._id === quiz.lessonId);
    if (lesson) {
      itemMap.set(quiz._id, {
        order: quiz.order ?? 0,
        lessonOrder: lesson.order ?? 0,
      });
    }
  });

  // Add final quiz to the map if it exists
  if (finalQuiz) {
    itemMap.set(finalQuiz._id, {
      order: Number.MAX_SAFE_INTEGER, // Always last
      lessonOrder: Number.MAX_SAFE_INTEGER, // Always last
    });
  }

  // Sort all items by lesson order and then item order
  const allItems = [
    ...topics,
    ...quizzes,
    ...(finalQuiz ? [finalQuiz] : []),
  ].sort((a, b) => {
    const orderA = itemMap.get(a._id);
    const orderB = itemMap.get(b._id);
    if (!orderA || !orderB) return 0;
    if (orderA.lessonOrder !== orderB.lessonOrder) {
      return orderA.lessonOrder - orderB.lessonOrder;
    }
    return orderA.order - orderB.order;
  });

  // Find first incomplete item
  const nextItem = allItems.find(
    (item) =>
      !progress.some(
        (p: Doc<"progress">) => p.itemId === item._id && p.completed,
      ),
  );

  return nextItem ?? null;
};
