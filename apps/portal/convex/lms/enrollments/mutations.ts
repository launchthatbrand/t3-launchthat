/**
 * Enrollments Mutations
 *
 * Contains all write operations for the enrollments feature.
 */
import { v } from "convex/values";

import { mutation } from "../../_generated/server";
import { requireAdmin } from "../../lib/permissions/requirePermission";

/**
 * Enroll a user in a course (admin-only)
 * Originally: addMemberToCourse
 */
export const addMemberToCourse = mutation({
  args: {
    courseId: v.id("courses"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Only admins can add course members
    await requireAdmin(ctx);

    // Prevent duplicate enrollments
    const existing = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId),
      )
      .unique();

    if (existing) {
      return null; // Already enrolled, nothing to do
    }

    await ctx.db.insert("courseEnrollments", {
      userId: args.userId,
      courseId: args.courseId,
      enrollmentDate: Date.now(),
      status: "active", // default status
    });

    return null;
  },
});

/**
 * Remove a user from a course (admin-only)
 * Originally: removeMemberFromCourse
 */
export const removeMemberFromCourse = mutation({
  args: {
    courseId: v.id("courses"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Find the enrollment document
    const enrollment = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId),
      )
      .unique();

    if (enrollment) {
      await ctx.db.delete(enrollment._id);
    }

    return null;
  },
});

/**
 * Create a new enrollment (general purpose)
 */
export const createEnrollment = mutation({
  args: {
    courseId: v.id("courses"),
    userId: v.id("users"),
    status: v.optional(v.string()),
  },
  returns: v.id("courseEnrollments"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Check if enrollment already exists
    const existing = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId),
      )
      .unique();

    if (existing) {
      throw new Error("User is already enrolled in this course");
    }

    const enrollmentId = await ctx.db.insert("courseEnrollments", {
      userId: args.userId,
      courseId: args.courseId,
      enrollmentDate: Date.now(),
      status: args.status ?? "active",
    });

    return enrollmentId;
  },
});

/**
 * Update enrollment status
 */
export const updateEnrollmentStatus = mutation({
  args: {
    enrollmentId: v.id("courseEnrollments"),
    status: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    await ctx.db.patch(args.enrollmentId, {
      status: args.status,
    });

    return null;
  },
});

/**
 * Delete an enrollment by ID
 */
export const deleteEnrollment = mutation({
  args: {
    enrollmentId: v.id("courseEnrollments"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.enrollmentId);
    return null;
  },
});
