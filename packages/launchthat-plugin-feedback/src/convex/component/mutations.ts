import { v } from "convex/values";

import { mutation } from "./server";

const asTrimmed = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

export const createThread = mutation({
  args: {
    boardId: v.string(),
    type: v.optional(v.union(v.literal("feedback"), v.literal("issue"))),
    authorUserId: v.string(),
    title: v.string(),
    body: v.string(),
  },
  returns: v.id("feedbackThreads"),
  handler: async (ctx, args) => {
    const title = asTrimmed(args.title);
    const body = asTrimmed(args.body);
    if (!title) throw new Error("Title is required");
    if (!body) throw new Error("Body is required");

    const now = Date.now();
    return await ctx.db.insert("feedbackThreads", {
      boardId: args.boardId,
      type: args.type ?? "feedback",
      authorUserId: args.authorUserId,
      title,
      body,
      status: "open",
      upvoteCount: 0,
      commentCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const toggleUpvote = mutation({
  args: {
    threadId: v.id("feedbackThreads"),
    userId: v.string(),
  },
  returns: v.object({
    upvoted: v.boolean(),
    upvoteCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const thread = await ctx.db.get(args.threadId);
    if (!thread) throw new Error("Thread not found");

    const existing = await ctx.db
      .query("feedbackVotes")
      .withIndex("by_thread_user", (q: any) =>
        q.eq("threadId", args.threadId).eq("userId", args.userId),
      )
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.delete(existing._id);
      const nextCount = Math.max(0, Number(thread.upvoteCount ?? 0) - 1);
      await ctx.db.patch(args.threadId, { upvoteCount: nextCount, updatedAt: now });
      return { upvoted: false, upvoteCount: nextCount };
    }

    await ctx.db.insert("feedbackVotes", {
      threadId: args.threadId,
      userId: args.userId,
      createdAt: now,
    });
    const nextCount = Number(thread.upvoteCount ?? 0) + 1;
    await ctx.db.patch(args.threadId, { upvoteCount: nextCount, updatedAt: now });
    return { upvoted: true, upvoteCount: nextCount };
  },
});

export const addComment = mutation({
  args: {
    threadId: v.id("feedbackThreads"),
    authorUserId: v.string(),
    body: v.string(),
  },
  returns: v.id("feedbackComments"),
  handler: async (ctx, args) => {
    const body = asTrimmed(args.body);
    if (!body) throw new Error("Comment is required");

    const thread = await ctx.db.get(args.threadId);
    if (!thread) throw new Error("Thread not found");

    const now = Date.now();
    const commentId = await ctx.db.insert("feedbackComments", {
      threadId: args.threadId,
      authorUserId: args.authorUserId,
      body,
      createdAt: now,
    });

    const nextCount = Number(thread.commentCount ?? 0) + 1;
    await ctx.db.patch(args.threadId, { commentCount: nextCount, updatedAt: now });
    return commentId;
  },
});

