/**
 * Enrollments Queries
 *
 * Contains all read operations for the enrollments feature.
 */
import { v } from "convex/values";

import { query } from "../../_generated/server";

/**
 * Get enrollments for a specific course
 */
export const getEnrollmentsByCourse = query({
  args: {
    courseId: v.id("courses"),
  },
  returns: v.array(
    v.object({
      _id: v.id("courseEnrollments"),
      _creationTime: v.number(),
      userId: v.id("users"),
      courseId: v.id("courses"),
      enrollmentDate: v.number(),
      status: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const enrollments = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    return enrollments;
  },
});

/**
 * Get enrollments for a specific user
 */
export const getEnrollmentsByUser = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(
    v.object({
      _id: v.id("courseEnrollments"),
      _creationTime: v.number(),
      userId: v.id("users"),
      courseId: v.id("courses"),
      enrollmentDate: v.number(),
      status: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const enrollments = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return enrollments;
  },
});

/**
 * Check if a user is enrolled in a specific course
 */
export const isUserEnrolled = query({
  args: {
    userId: v.id("users"),
    courseId: v.id("courses"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const enrollment = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId),
      )
      .unique();

    return !!enrollment;
  },
});

/**
 * Get a specific enrollment by user and course
 */
export const getEnrollment = query({
  args: {
    userId: v.id("users"),
    courseId: v.id("courses"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("courseEnrollments"),
      _creationTime: v.number(),
      userId: v.id("users"),
      courseId: v.id("courses"),
      enrollmentDate: v.number(),
      status: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const enrollment = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId),
      )
      .unique();

    return enrollment || null;
  },
});
