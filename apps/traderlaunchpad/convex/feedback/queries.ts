import { v } from "convex/values";

import { components } from "../_generated/api";
import { query } from "../_generated/server";
import { resolveViewerUserId } from "../traderlaunchpad/lib/resolve";

type UnknownRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is UnknownRecord =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export const listThreads = query({
  args: {
    sort: v.optional(v.union(v.literal("trending"), v.literal("new"))),
    type: v.optional(v.union(v.literal("feedback"), v.literal("issue"))),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const userId = await resolveViewerUserId(ctx);
    if (!userId) return [];

    return (await ctx.runQuery(
      (components as any).launchthat_feedback.queries.listThreadsForUser,
      { boardId: "global", userId, sort: args.sort, type: args.type },
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

