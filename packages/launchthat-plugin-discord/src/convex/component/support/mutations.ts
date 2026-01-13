import { v } from "convex/values";

import { mutation } from "../server";

export const upsertSupportThreadAndMessage = mutation({
  args: {
    organizationId: v.string(),
    guildId: v.string(),
    threadId: v.string(),
    forumChannelId: v.optional(v.string()),
    threadName: v.optional(v.string()),
    createdByDiscordUserId: v.optional(v.string()),

    // Optional message payload
    messageId: v.optional(v.string()),
    authorDiscordUserId: v.optional(v.string()),
    authorIsBot: v.optional(v.boolean()),
    content: v.optional(v.string()),
    messageCreatedAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();

    const existingThread = await ctx.db
      .query("supportThreads")
      .withIndex("by_guildId_and_threadId", (q: any) =>
        q.eq("guildId", args.guildId).eq("threadId", args.threadId),
      )
      .first();

    if (existingThread) {
      await ctx.db.patch((existingThread as any)._id, {
        title: args.threadName ?? (existingThread as any).title,
        forumChannelId:
          args.forumChannelId ?? (existingThread as any).forumChannelId,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("supportThreads", {
        organizationId: args.organizationId,
        guildId: args.guildId,
        threadId: args.threadId,
        forumChannelId: args.forumChannelId,
        title: args.threadName,
        createdByDiscordUserId: args.createdByDiscordUserId,
        status: "open",
        createdAt: now,
        updatedAt: now,
      });
    }

    if (args.messageId && typeof args.content === "string") {
      const existingMsg = await ctx.db
        .query("supportMessages")
        .withIndex("by_guildId_and_messageId", (q: any) =>
          q.eq("guildId", args.guildId).eq("messageId", args.messageId),
        )
        .first();
      if (!existingMsg) {
        await ctx.db.insert("supportMessages", {
          organizationId: args.organizationId,
          guildId: args.guildId,
          threadId: args.threadId,
          messageId: args.messageId,
          authorDiscordUserId: args.authorDiscordUserId,
          authorIsBot: Boolean(args.authorIsBot),
          content: args.content,
          createdAt: args.messageCreatedAt ?? now,
        });
      }
    }

    return null;
  },
});

export const recordSupportAiRun = mutation({
  args: {
    organizationId: v.string(),
    guildId: v.string(),
    threadId: v.string(),
    triggerMessageId: v.string(),
    promptHash: v.string(),
    model: v.optional(v.string()),
    confidence: v.optional(v.number()),
    escalated: v.boolean(),
    answer: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("supportAiRuns", {
      ...args,
      createdAt: Date.now(),
    });
    return null;
  },
});

export const logDiscordApiCall = mutation({
  args: {
    organizationId: v.optional(v.string()),
    guildId: v.optional(v.string()),
    kind: v.string(),
    method: v.string(),
    url: v.string(),
    status: v.number(),
    retryAfterMs: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("discordApiLogs", {
      ...args,
      createdAt: Date.now(),
    });
    return null;
  },
});

export const setEscalationMapping = mutation({
  args: {
    organizationId: v.string(),
    guildId: v.string(),
    publicThreadId: v.string(),
    privateThreadId: v.string(),
    requesterDiscordUserId: v.string(),
    keyword: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();

    const publicThread = await ctx.db
      .query("supportThreads")
      .withIndex("by_guildId_and_threadId", (q: any) =>
        q.eq("guildId", args.guildId).eq("threadId", args.publicThreadId),
      )
      .first();

    if (publicThread) {
      await ctx.db.patch((publicThread as any)._id, {
        escalatedToPrivateThreadId: args.privateThreadId,
        escalationRequesterDiscordUserId: args.requesterDiscordUserId,
        escalationKeyword: args.keyword,
        escalatedAt: now,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("supportThreads", {
        organizationId: args.organizationId,
        guildId: args.guildId,
        threadId: args.publicThreadId,
        status: "open",
        escalatedToPrivateThreadId: args.privateThreadId,
        escalationRequesterDiscordUserId: args.requesterDiscordUserId,
        escalationKeyword: args.keyword,
        escalatedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    const privateThread = await ctx.db
      .query("supportThreads")
      .withIndex("by_guildId_and_threadId", (q: any) =>
        q.eq("guildId", args.guildId).eq("threadId", args.privateThreadId),
      )
      .first();

    if (privateThread) {
      await ctx.db.patch((privateThread as any)._id, {
        escalatedFromPublicThreadId: args.publicThreadId,
        escalationRequesterDiscordUserId: args.requesterDiscordUserId,
        escalationKeyword: args.keyword,
        escalatedAt: now,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("supportThreads", {
        organizationId: args.organizationId,
        guildId: args.guildId,
        threadId: args.privateThreadId,
        status: "open",
        escalatedFromPublicThreadId: args.publicThreadId,
        escalationRequesterDiscordUserId: args.requesterDiscordUserId,
        escalationKeyword: args.keyword,
        escalatedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    return null;
  },
});


