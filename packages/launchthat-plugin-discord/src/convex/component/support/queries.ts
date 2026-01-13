import { v } from "convex/values";

import { query } from "../server";

export const hasAiRunForTriggerMessage = query({
  args: { guildId: v.string(), triggerMessageId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("supportAiRuns")
      .withIndex("by_guildId_and_triggerMessageId", (q: any) =>
        q
          .eq("guildId", args.guildId)
          .eq("triggerMessageId", args.triggerMessageId),
      )
      .first();
    return Boolean(row);
  },
});

export const getEscalationMappingForThread = query({
  args: { guildId: v.string(), threadId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      publicThreadId: v.string(),
      privateThreadId: v.string(),
      requesterDiscordUserId: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("supportThreads")
      .withIndex("by_guildId_and_threadId", (q: any) =>
        q.eq("guildId", args.guildId).eq("threadId", args.threadId),
      )
      .first();
    if (!row) return null;

    const r: any = row;
    const requester =
      typeof r.escalationRequesterDiscordUserId === "string" &&
      r.escalationRequesterDiscordUserId.trim()
        ? String(r.escalationRequesterDiscordUserId)
        : "";
    if (!requester) return null;

    if (typeof r.escalatedToPrivateThreadId === "string" && r.escalatedToPrivateThreadId.trim()) {
      return {
        publicThreadId: String(r.threadId),
        privateThreadId: String(r.escalatedToPrivateThreadId),
        requesterDiscordUserId: requester,
      };
    }

    if (
      typeof r.escalatedFromPublicThreadId === "string" &&
      r.escalatedFromPublicThreadId.trim()
    ) {
      return {
        publicThreadId: String(r.escalatedFromPublicThreadId),
        privateThreadId: String(r.threadId),
        requesterDiscordUserId: requester,
      };
    }

    return null;
  },
});


