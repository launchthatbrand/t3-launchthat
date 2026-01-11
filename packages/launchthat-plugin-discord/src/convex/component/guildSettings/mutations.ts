import { v } from "convex/values";

import { mutation } from "../server";

export const upsertGuildSettings = mutation({
  args: {
    organizationId: v.string(),
    guildId: v.string(),
    supportAiEnabled: v.boolean(),
    supportForumChannelId: v.optional(v.string()),
    supportStaffRoleId: v.optional(v.string()),
    escalationKeywords: v.optional(v.array(v.string())),
    escalationConfidenceThreshold: v.optional(v.number()),
    threadReplyCooldownMs: v.optional(v.number()),
    supportAiDisabledMessageEnabled: v.optional(v.boolean()),
    supportAiDisabledMessageText: v.optional(v.string()),
    courseUpdatesChannelId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("guildSettings")
      .withIndex("by_organizationId_and_guildId", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("guildId", args.guildId),
      )
      .first();

    const patch = {
      organizationId: args.organizationId,
      guildId: args.guildId,
      supportAiEnabled: args.supportAiEnabled,
      supportForumChannelId: args.supportForumChannelId,
      supportStaffRoleId: args.supportStaffRoleId,
      escalationKeywords: args.escalationKeywords,
      escalationConfidenceThreshold: args.escalationConfidenceThreshold,
      threadReplyCooldownMs: args.threadReplyCooldownMs,
      supportAiDisabledMessageEnabled: args.supportAiDisabledMessageEnabled,
      supportAiDisabledMessageText: args.supportAiDisabledMessageText,
      courseUpdatesChannelId: args.courseUpdatesChannelId,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch((existing as any)._id, patch);
    } else {
      await ctx.db.insert("guildSettings", patch);
    }
    return null;
  },
});


