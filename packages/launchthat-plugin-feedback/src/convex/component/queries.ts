import { v } from "convex/values";

import { query } from "./server";

type SortMode = "trending" | "new";

export const listThreadsForUser = query({
  args: {
    boardId: v.string(),
    userId: v.string(),
    sort: v.optional(v.union(v.literal("trending"), v.literal("new"))),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const sort: SortMode = args.sort ?? "trending";
    const limit = Math.max(1, Math.min(100, args.limit ?? 50));

    const votes = await ctx.db
      .query("feedbackVotes")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect();
    const voted = new Set<string>(votes.map((v: any) => String(v.threadId)));

    const base =
      sort === "new"
        ? ctx.db
            .query("feedbackThreads")
            .withIndex("by_board_createdAt", (q: any) => q.eq("boardId", args.boardId))
            .order("desc")
        : ctx.db
            .query("feedbackThreads")
            .withIndex("by_board_upvoteCount_and_createdAt", (q: any) =>
              q.eq("boardId", args.boardId),
            )
            .order("desc");

    const rows = await base.take(limit);
    return rows.map((t: any) => ({
      ...t,
      viewerHasUpvoted: voted.has(String(t._id)),
    }));
  },
});

export const getThreadWithViewer = query({
  args: { threadId: v.id("feedbackThreads"), userId: v.string() },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    const thread = await ctx.db.get(args.threadId);
    if (!thread) return null;
    const vote = await ctx.db
      .query("feedbackVotes")
      .withIndex("by_thread_user", (q: any) =>
        q.eq("threadId", args.threadId).eq("userId", args.userId),
      )
      .first();
    return { ...thread, viewerHasUpvoted: Boolean(vote) };
  },
});

export const listComments = query({
  args: {
    threadId: v.id("feedbackThreads"),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(200, args.limit ?? 100));
    return await ctx.db
      .query("feedbackComments")
      .withIndex("by_thread_createdAt", (q: any) => q.eq("threadId", args.threadId))
      .order("asc")
      .take(limit);
  },
});

