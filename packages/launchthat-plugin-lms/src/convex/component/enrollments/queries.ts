import { v } from "convex/values";

import { query } from "../_generated/server";

export const getEnrollment = query({
  args: {
    courseId: v.string(),
    userId: v.string(),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courseEnrollments")
      .withIndex("by_course_and_user", (q) =>
        q.eq("courseId", args.courseId).eq("userId", args.userId),
      )
      .unique();
  },
});

export const listEnrollmentsForCourse = query({
  args: {
    courseId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courseEnrollments")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .order("desc")
      .collect();
  },
});

export const listEnrollmentsForUser = query({
  args: {
    userId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courseEnrollments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});


