import { v } from "convex/values";

import { mutation } from "../server";

export const upsertGuildSettings = mutation({
  args: {
    guildId: v.string(),
    inviteUrl: v.optional(v.string()),
    approvedMemberRoleId: v.optional(v.string()),
    supportAiEnabled: v.boolean(),
    supportForumChannelId: v.optional(v.string()),
    supportPrivateIntakeChannelId: v.optional(v.string()),
    supportStaffRoleId: v.optional(v.string()),
    escalationKeywords: v.optional(v.array(v.string())),
    escalationConfidenceThreshold: v.optional(v.number()),
    threadReplyCooldownMs: v.optional(v.number()),
    supportAiDisabledMessageEnabled: v.optional(v.boolean()),
    supportAiDisabledMessageText: v.optional(v.string()),
    courseUpdatesChannelId: v.optional(v.string()),
    announcementChannelId: v.optional(v.string()),
    announcementEventKeys: v.optional(v.array(v.string())),
    mentorTradesChannelId: v.optional(v.string()),
    memberTradesChannelId: v.optional(v.string()),
    mentorTradesTemplateId: v.optional(v.id("platformMessageTemplates")),
    memberTradesTemplateId: v.optional(v.id("platformMessageTemplates")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("platformGuildSettings")
      .withIndex("by_guildId", (q: any) => q.eq("guildId", args.guildId))
      .first();

    const patch = {
      guildId: args.guildId,
      inviteUrl: args.inviteUrl,
      approvedMemberRoleId: args.approvedMemberRoleId,
      supportAiEnabled: args.supportAiEnabled,
      supportForumChannelId: args.supportForumChannelId,
      supportPrivateIntakeChannelId: args.supportPrivateIntakeChannelId,
      supportStaffRoleId: args.supportStaffRoleId,
      escalationKeywords: args.escalationKeywords,
      escalationConfidenceThreshold: args.escalationConfidenceThreshold,
      threadReplyCooldownMs: args.threadReplyCooldownMs,
      supportAiDisabledMessageEnabled: args.supportAiDisabledMessageEnabled,
      supportAiDisabledMessageText: args.supportAiDisabledMessageText,
      courseUpdatesChannelId: args.courseUpdatesChannelId,
      announcementChannelId: args.announcementChannelId,
      announcementEventKeys: args.announcementEventKeys,
      mentorTradesChannelId: args.mentorTradesChannelId,
      memberTradesChannelId: args.memberTradesChannelId,
      mentorTradesTemplateId: args.mentorTradesTemplateId,
      memberTradesTemplateId: args.memberTradesTemplateId,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch((existing as any)._id, patch);
    } else {
      await ctx.db.insert("platformGuildSettings", patch);
    }
    return null;
  },
});
