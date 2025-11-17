/**
 * Lessons Helpers
 *
 * Contains shared utility functions for the lessons feature.
 */
import type { Id } from "../../_generated/dataModel";
import type { QueryCtx } from "../../_generated/server";

/**
 * Get lesson statistics (topic count, completion rate, etc.)
 */
export const getLessonStats = async (
  ctx: QueryCtx,
  lessonId: Id<"lessons">,
): Promise<{
  topicCount: number;
  quizCount: number;
  enrollmentCount: number;
} | null> => {
  const lesson = await ctx.db.get(lessonId);
  if (!lesson) {
    return null;
  }

  // Count topics in this lesson
  const topics = await ctx.db
    .query("topics")
    .withIndex("by_lesson", (q) => q.eq("lessonId", lessonId))
    .collect();
  const topicCount = topics.length;

  // Count quizzes in this lesson
  const quizzes = await ctx.db
    .query("quizzes")
    .withIndex("by_lesson", (q) => q.eq("lessonId", lessonId))
    .collect();
  const quizCount = quizzes.length;

  // Count enrollments (would need to implement proper enrollment tracking)
  const enrollmentCount = 0; // Placeholder

  return {
    topicCount,
    quizCount,
    enrollmentCount,
  };
};

/**
 * Check if a lesson is ready for publication
 */
export const isLessonReadyForPublication = async (
  ctx: QueryCtx,
  lessonId: Id<"lessons">,
): Promise<boolean> => {
  const lesson = await ctx.db.get(lessonId);
  if (!lesson) {
    return false;
  }

  // Basic requirements for publication
  const hasTitle = !!lesson.title && lesson.title.trim().length > 0;
  const hasContent = !!lesson.content && lesson.content.trim().length > 0;

  // Check if lesson has at least one topic
  const topics = await ctx.db
    .query("topics")
    .withIndex("by_lesson", (q) => q.eq("lessonId", lessonId))
    .collect();
  const hasTopics = topics.length > 0;

  return hasTitle && hasContent && hasTopics;
};
