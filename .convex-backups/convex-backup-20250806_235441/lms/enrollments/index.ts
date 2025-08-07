import { v } from "convex/values";

import { mutation } from "../../_generated/server";
import { requireAdmin } from "../../lib/permissions/requirePermission";

// Enrollments logic will be moved here

// Mutation: Enroll a user in a course (admin-only)
export const addMemberToCourse = mutation({
  args: {
    courseId: v.id("courses"),
    userId: v.id("users"),
  },
  // Explicitly return null to satisfy validator contracts
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

// Mutation: Remove a user from a course (admin-only)
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
