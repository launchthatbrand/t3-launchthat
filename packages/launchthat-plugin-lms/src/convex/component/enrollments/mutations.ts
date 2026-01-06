import { v } from "convex/values";

import { mutation } from "../_generated/server";

type EnrollmentSource = "manual" | "crm_tag" | "purchase";

export const upsertEnrollment = mutation({
  args: {
    organizationId: v.optional(v.string()),
    courseId: v.string(),
    userId: v.string(),
    status: v.union(v.literal("active"), v.literal("revoked")),
    source: v.union(v.literal("manual"), v.literal("crm_tag"), v.literal("purchase")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_course_and_user", (q) =>
        q.eq("courseId", args.courseId).eq("userId", args.userId),
      )
      .unique();

    const patch = {
      organizationId: args.organizationId ?? undefined,
      status: args.status,
      source: args.source as EnrollmentSource,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return null;
    }

    await ctx.db.insert("courseEnrollments", {
      ...patch,
      courseId: args.courseId,
      userId: args.userId,
      createdAt: now,
      updatedAt: now,
    });
    return null;
  },
});

export const revokeEnrollment = mutation({
  args: {
    courseId: v.string(),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_course_and_user", (q) =>
        q.eq("courseId", args.courseId).eq("userId", args.userId),
      )
      .unique();
    if (!existing) return null;
    await ctx.db.patch(existing._id, {
      status: "revoked",
      updatedAt: Date.now(),
    });
    return null;
  },
});


