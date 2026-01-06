/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { mutation } from "../../../_generated/server";

const lmsEnrollmentMutations = (components as any).launchthat_lms.enrollments.mutations;

const ensureAdminOrOwner = async (ctx: any) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  const requester = await ctx.db
    .query("users")
    .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  const role = typeof requester?.role === "string" ? requester.role : "";
  if (role !== "admin" && role !== "owner") {
    throw new Error("Not authorized");
  }
  return requester;
};

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
    await ctx.runMutation(lmsEnrollmentMutations.upsertEnrollment, args);
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
    await ctx.runMutation(lmsEnrollmentMutations.revokeEnrollment, args);
    return null;
  },
});

export const enrollUserByEmail = mutation({
  args: {
    organizationId: v.optional(v.string()),
    courseId: v.string(),
    email: v.string(),
  },
  returns: v.union(v.null(), v.string()),
  handler: async (ctx, args) => {
    await ensureAdminOrOwner(ctx);
    const email = args.email.trim().toLowerCase();
    if (!email) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .first();
    if (!user?._id) return null;

    await ctx.runMutation(lmsEnrollmentMutations.upsertEnrollment, {
      organizationId: args.organizationId,
      courseId: args.courseId,
      userId: String(user._id),
      status: "active",
      source: "manual",
    });

    return String(user._id);
  },
});


