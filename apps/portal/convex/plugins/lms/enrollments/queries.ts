/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { query } from "../../../_generated/server";

const lmsEnrollmentQueries = (components as any).launchthat_lms.enrollments.queries;

export const getEnrollment = query({
  args: {
    courseId: v.string(),
    userId: v.string(),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    return await ctx.runQuery(lmsEnrollmentQueries.getEnrollment, args);
  },
});

export const listEnrollmentsForCourse = query({
  args: {
    courseId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(lmsEnrollmentQueries.listEnrollmentsForCourse, args);
  },
});

export const listCourseMembers = query({
  args: {
    courseId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const enrollments = (await ctx.runQuery(
      lmsEnrollmentQueries.listEnrollmentsForCourse,
      args,
    )) as any[];

    const userIds = Array.isArray(enrollments)
      ? Array.from(
          new Set(
            enrollments
              .map((e) => (typeof e?.userId === "string" ? e.userId : null))
              .filter(Boolean),
          ),
        )
      : [];

    const usersById = new Map<string, any>();
    await Promise.all(
      userIds.map(async (userId) => {
        const user = await ctx.db.get(userId as any);
        if (user) usersById.set(userId, user);
      }),
    );

    return Array.isArray(enrollments)
      ? enrollments.map((e) => ({
          ...e,
          user: typeof e?.userId === "string" ? usersById.get(e.userId) ?? null : null,
        }))
      : [];
  },
});

export const listEnrollmentsForUser = query({
  args: {
    userId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(lmsEnrollmentQueries.listEnrollmentsForUser, args);
  },
});


