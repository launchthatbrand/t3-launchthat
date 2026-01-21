import { v } from "convex/values";
import type { FunctionReference } from "convex/server";

import { api, components } from "../_generated/api";
import { mutation } from "../_generated/server";

interface FeedbackComponentMutations {
  createThread: FunctionReference<
    "mutation",
    "internal",
    { boardId: string; authorUserId: string; title: string; body: string },
    string
  >;
  toggleUpvote: FunctionReference<
    "mutation",
    "internal",
    { threadId: string; userId: string },
    unknown
  >;
  addComment: FunctionReference<
    "mutation",
    "internal",
    { threadId: string; authorUserId: string; body: string },
    string
  >;
}

const feedbackMutations = (() => {
  const componentsAny = components as unknown as {
    launchthat_feedback?: { mutations?: unknown };
  };
  return (componentsAny.launchthat_feedback?.mutations ??
    {}) as FeedbackComponentMutations;
})();

export const createThread = mutation({
  args: { title: v.string(), body: v.string() },
  returns: v.string(),
  handler: async (ctx, args): Promise<string> => {
    const userId = await ctx.runMutation(api.coreTenant.mutations.createOrGetUser, {});
    if (typeof userId !== "string" || !userId) {
      throw new Error("Unauthorized");
    }

    const threadId: string = await ctx.runMutation(feedbackMutations.createThread, {
      boardId: "global",
      authorUserId: userId,
      title: args.title,
      body: args.body,
    });
    return threadId;
  },
});

export const toggleUpvote = mutation({
  args: { threadId: v.string() },
  returns: v.any(),
  handler: async (ctx, args): Promise<unknown> => {
    const userId = await ctx.runMutation(api.coreTenant.mutations.createOrGetUser, {});
    if (typeof userId !== "string" || !userId) {
      throw new Error("Unauthorized");
    }
    return await ctx.runMutation(feedbackMutations.toggleUpvote, {
      threadId: args.threadId,
      userId,
    });
  },
});

export const addComment = mutation({
  args: { threadId: v.string(), body: v.string() },
  returns: v.string(),
  handler: async (ctx, args): Promise<string> => {
    const userId = await ctx.runMutation(api.coreTenant.mutations.createOrGetUser, {});
    if (typeof userId !== "string" || !userId) {
      throw new Error("Unauthorized");
    }
    const commentId: string = await ctx.runMutation(feedbackMutations.addComment, {
      threadId: args.threadId,
      authorUserId: userId,
      body: args.body,
    });
    return commentId;
  },
});

