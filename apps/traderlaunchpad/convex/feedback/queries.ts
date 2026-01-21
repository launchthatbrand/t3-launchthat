import { v } from "convex/values";

import { components } from "../_generated/api";
import { query } from "../_generated/server";

type UnknownRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is UnknownRecord =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const resolveViewerUserId = async (ctx: any): Promise<string | null> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  if (identity.tokenIdentifier) {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (isRecord(user) && typeof user._id === "string") return user._id;
  }

  const subject =
    typeof identity.subject === "string" && identity.subject.trim() ? identity.subject.trim() : "";
  if (!subject) return null;

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", subject))
    .first();
  if (isRecord(user) && typeof user._id === "string") return user._id;

  return null;
};

export const listThreads = query({
  args: {
    sort: v.optional(v.union(v.literal("trending"), v.literal("new"))),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const userId = await resolveViewerUserId(ctx);
    if (!userId) return [];

    return (await ctx.runQuery(
      (components as any).launchthat_feedback.queries.listThreadsForUser,
      { boardId: "global", userId, sort: args.sort },
    )) as any;
  },
});

export const getThread = query({
  args: { threadId: v.string() },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    const userId = await resolveViewerUserId(ctx);
    if (!userId) return null;

    return (await ctx.runQuery(
      (components as any).launchthat_feedback.queries.getThreadWithViewer,
      { threadId: args.threadId, userId },
    )) as any;
  },
});

export const listComments = query({
  args: { threadId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const userId = await resolveViewerUserId(ctx);
    if (!userId) return [];

    return (await ctx.runQuery(
      (components as any).launchthat_feedback.queries.listComments,
      { threadId: args.threadId },
    )) as any;
  },
});

