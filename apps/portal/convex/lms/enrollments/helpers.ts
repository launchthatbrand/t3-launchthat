/**
 * Enrollments Helpers
 *
 * Contains shared utility functions for the enrollments feature.
 */
import { Id } from "../../_generated/dataModel";
import { QueryCtx } from "../../_generated/server";

/**
 * Get enrollment statistics for a course
 */
export const getCourseEnrollmentStats = async (
  ctx: QueryCtx,
  courseId: Id<"courses">,
): Promise<{
  totalEnrollments: number;
  activeEnrollments: number;
  inactiveEnrollments: number;
} | null> => {
  const course = await ctx.db.get(courseId);
  if (!course) {
    return null;
  }

  const enrollments = await ctx.db
    .query("courseEnrollments")
    .withIndex("by_course", (q) => q.eq("courseId", courseId))
    .collect();

  const totalEnrollments = enrollments.length;
  const activeEnrollments = enrollments.filter(
    (e) => e.status === "active",
  ).length;
  const inactiveEnrollments = totalEnrollments - activeEnrollments;

  return {
    totalEnrollments,
    activeEnrollments,
    inactiveEnrollments,
  };
};

/**
 * Get enrollment statistics for a user
 */
export const getUserEnrollmentStats = async (
  ctx: QueryCtx,
  userId: Id<"users">,
): Promise<{
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
} | null> => {
  const user = await ctx.db.get(userId);
  if (!user) {
    return null;
  }

  const enrollments = await ctx.db
    .query("courseEnrollments")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const totalEnrollments = enrollments.length;
  const activeEnrollments = enrollments.filter(
    (e) => e.status === "active",
  ).length;
  const completedEnrollments = enrollments.filter(
    (e) => e.status === "completed",
  ).length;

  return {
    totalEnrollments,
    activeEnrollments,
    completedEnrollments,
  };
};

/**
 * Check if enrollment is valid and active
 */
export const isEnrollmentActive = (
  enrollment: { status?: string } | null,
): boolean => {
  return enrollment !== null && enrollment.status === "active";
};

/**
 * Calculate days since enrollment
 */
export const getDaysSinceEnrollment = (enrollmentDate: number): number => {
  const now = Date.now();
  const daysDiff = Math.floor((now - enrollmentDate) / (1000 * 60 * 60 * 24));
  return daysDiff;
};
