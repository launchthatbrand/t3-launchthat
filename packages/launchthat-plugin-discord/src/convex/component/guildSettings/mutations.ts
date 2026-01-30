import { v } from "convex/values";

import { mutation } from "../server";

export const upsertGuildSettings = mutation({
  args: {
    scope: v.optional(v.union(v.literal("org"), v.literal("platform"))),
    organizationId: v.optional(v.string()),
    guildId: v.string(),
    inviteUrl: v.optional(v.string()),
    autoJoinEnabled: v.optional(v.boolean()),
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
    mentorTradesTemplateId: v.optional(v.id("messageTemplates")),
    memberTradesTemplateId: v.optional(v.id("messageTemplates")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const scope = args.scope ?? "org";
    const organizationId = typeof args.organizationId === "string" ? args.organizationId : undefined;
    if (scope === "org" && !organizationId) {
      throw new Error("organizationId is required when scope=org");
    }
    const existing = await ctx.db
      .query("guildSettings")
      .withIndex("by_scope_and_organizationId_and_guildId", (q: any) =>
        q.eq("scope", scope).eq("organizationId", organizationId).eq("guildId", args.guildId),
      )
      .first();

    const patch = {
      scope,
      organizationId,
      guildId: args.guildId,
      inviteUrl: args.inviteUrl,
      autoJoinEnabled: args.autoJoinEnabled,
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
      await ctx.db.insert("guildSettings", patch);
    }
    return null;
  },
});


