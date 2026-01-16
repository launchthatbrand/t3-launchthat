import { v } from "convex/values";

import { components } from "../_generated/api";
import { mutation } from "../_generated/server";
import { resolveOrganizationId, resolveViewerUserId } from "../traderlaunchpad/lib/resolve";

const discordGuildSettingsMutations =
  components.launchthat_discord.guildSettings.mutations as any;
const discordTemplatesMutations = components.launchthat_discord.templates
  .mutations as any;
const discordUserLinksMutations = components.launchthat_discord.userLinks
  .mutations as any;

export const upsertGuildSettings = mutation({
  args: {
    guildId: v.string(),
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
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    await resolveViewerUserId(ctx);
    await ctx.runMutation(discordGuildSettingsMutations.upsertGuildSettings, {
      organizationId,
      ...args,
    });
    return null;
  },
});

export const upsertTemplate = mutation({
  args: {
    guildId: v.optional(v.string()),
    kind: v.union(v.literal("tradeidea")),
    template: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    await resolveViewerUserId(ctx);
    await ctx.runMutation(discordTemplatesMutations.upsertTemplate, {
      organizationId,
      ...args,
    });
    return null;
  },
});

export const unlinkMyDiscordLink = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    await ctx.runMutation(discordUserLinksMutations.unlinkUser, {
      organizationId,
      userId,
    });
    return null;
  },
});
