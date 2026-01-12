/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { mutation } from "../../../_generated/server";
import { getAuthenticatedUserDocIdByToken } from "../../../core/lib/permissions";

const lmsEnrollmentMutations = (components as any).launchthat_lms.enrollments.mutations;
const logsMutations = (components as any).launchthat_logs.entries.mutations;
const lmsPostsQueries = (components as any).launchthat_lms.posts.queries;

const stripUndefined = (value: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined));

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

    // Best-effort mirror into unified logs.
    try {
      const actorUserId = await getAuthenticatedUserDocIdByToken(ctx);
      const actor = await ctx.db.get(actorUserId);
      const targetUser = await ctx.db.get(args.userId as any);
      const course: any = await ctx.runQuery(lmsPostsQueries.getPostByIdInternal, {
        id: args.courseId as any,
      });
      const organizationId =
        (course?.organizationId ?? undefined) ??
        (args.organizationId ?? undefined) ??
        "";
      if (!organizationId) {
        throw new Error("Missing organizationId for enrollment log");
      }

      const kind =
        args.status === "active"
          ? "lms.enrollment.granted"
          : "lms.enrollment.revoked";

      const email =
        typeof targetUser?.email === "string"
          ? targetUser.email.trim().toLowerCase()
          : undefined;
      const meta = stripUndefined({
        courseId: args.courseId,
        userId: args.userId,
        status: args.status,
        source: args.source,
      });

      await ctx.runMutation(logsMutations.insertLogEntry as any, {
        organizationId: String(organizationId),
        pluginKey: "lms",
        kind,
        email,
        level: "info",
        status: "complete",
        message:
          args.status === "active"
            ? `Granted course access (${args.courseId}) to ${email ?? args.userId}`
            : `Revoked course access (${args.courseId}) from ${email ?? args.userId}`,
        scopeKind: "course",
        scopeId: String(args.courseId),
        actorUserId: String(actorUserId),
        metadata: Object.keys(meta).length ? meta : undefined,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error("[lms.upsertEnrollment] log mirror failed:", error);
    }

    return null;
  },
});

export const revokeEnrollment = mutation({
  args: {
    courseId: v.string(),
    userId: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(lmsEnrollmentMutations.revokeEnrollment, args);

    // Best-effort mirror into unified logs.
    try {
      const actorUserId = await getAuthenticatedUserDocIdByToken(ctx);
      const targetUser = await ctx.db.get(args.userId as any);
      const course: any = await ctx.runQuery(lmsPostsQueries.getPostByIdInternal, {
        id: args.courseId as any,
      });
      const organizationId =
        (course?.organizationId ?? undefined) ??
        (args.organizationId ?? undefined) ??
        "";
      if (!organizationId) {
        throw new Error("Missing organizationId for enrollment revoke log");
      }

      const email =
        typeof targetUser?.email === "string"
          ? targetUser.email.trim().toLowerCase()
          : undefined;
      const meta = stripUndefined({
        courseId: args.courseId,
        userId: args.userId,
        status: "revoked",
        source: "manual",
      });

      await ctx.runMutation(logsMutations.insertLogEntry as any, {
        organizationId: String(organizationId),
        pluginKey: "lms",
        kind: "lms.enrollment.revoked",
        email,
        level: "info",
        status: "complete",
        message: `Revoked course access (${args.courseId}) from ${email ?? args.userId}`,
        scopeKind: "course",
        scopeId: String(args.courseId),
        actorUserId: String(actorUserId),
        metadata: Object.keys(meta).length ? meta : undefined,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error("[lms.revokeEnrollment] log mirror failed:", error);
    }

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

    // Best-effort mirror into unified logs.
    try {
      const actorUserId = await getAuthenticatedUserDocIdByToken(ctx);
      const course: any = await ctx.runQuery(lmsPostsQueries.getPostByIdInternal, {
        id: args.courseId as any,
      });
      const organizationId =
        (course?.organizationId ?? undefined) ??
        (args.organizationId ?? undefined) ??
        "";
      if (!organizationId) {
        throw new Error("Missing organizationId for enrollment log");
      }
      const meta = stripUndefined({
        courseId: args.courseId,
        userId: String(user._id),
        status: "active",
        source: "manual",
      });

      await ctx.runMutation(logsMutations.insertLogEntry as any, {
        organizationId: String(organizationId),
        pluginKey: "lms",
        kind: "lms.enrollment.granted",
        email,
        level: "info",
        status: "complete",
        message: `Granted course access (${args.courseId}) to ${email}`,
        scopeKind: "course",
        scopeId: String(args.courseId),
        actorUserId: String(actorUserId),
        metadata: Object.keys(meta).length ? meta : undefined,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error("[lms.enrollUserByEmail] log mirror failed:", error);
    }

    return String(user._id);
  },
});


