import { v } from "convex/values";

import { query } from "../_generated/server";

export const getCourseProgressByUserCourse = query({
  args: {
    userId: v.string(),
    courseId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courseProgress")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId),
      )
      .unique();
  },
});

export const listQuizAttemptsByUserAndQuiz = query({
  args: {
    userId: v.string(),
    quizId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const attempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return attempts.filter((attempt) => attempt.quizId === args.quizId);
  },
});


