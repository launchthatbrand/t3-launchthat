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
const discordUserStreamingMutations = components.launchthat_discord.userStreaming
  .mutations as any;

export const upsertGuildSettings = mutation({
  args: {
    organizationId: v.optional(v.string()),
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
    mentorTradesTemplateId: v.optional(v.string()),
    memberTradesTemplateId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
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
    organizationId: v.optional(v.string()),
    guildId: v.optional(v.string()),
    kind: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    template: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
    await resolveViewerUserId(ctx);
    await ctx.runMutation(discordTemplatesMutations.upsertTemplate, {
      organizationId,
      ...args,
    });
    return null;
  },
});

export const createTemplate = mutation({
  args: {
    organizationId: v.optional(v.string()),
    guildId: v.optional(v.string()),
    kind: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    template: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
    await resolveViewerUserId(ctx);
    const templateId = await ctx.runMutation(
      discordTemplatesMutations.createTemplate,
      {
      organizationId,
      ...args,
      },
    );
    return String(templateId);
  },
});

export const updateTemplate = mutation({
  args: {
    organizationId: v.optional(v.string()),
    templateId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    template: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
    await resolveViewerUserId(ctx);
    await ctx.runMutation(discordTemplatesMutations.updateTemplate, {
      organizationId,
      ...args,
    });
    return null;
  },
});

export const deleteTemplate = mutation({
  args: {
    organizationId: v.optional(v.string()),
    templateId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
    await resolveViewerUserId(ctx);
    await ctx.runMutation(discordTemplatesMutations.deleteTemplate, {
      organizationId,
      ...args,
    });
    return null;
  },
});

export const unlinkMyDiscordLink = mutation({
  args: { organizationId: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    await ctx.runMutation(discordUserLinksMutations.unlinkUser, {
      organizationId,
      userId,
    });
    return null;
  },
});

export const disconnectMyDiscordStreaming = mutation({
  args: { organizationId: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);

    await ctx.runMutation(discordUserLinksMutations.unlinkUser, {
      organizationId,
      userId,
    });
    await ctx.runMutation(discordUserStreamingMutations.setUserStreamingEnabled, {
      organizationId,
      userId,
      enabled: false,
    });
    return null;
  },
});

export const setMyDiscordStreamingEnabled = mutation({
  args: { organizationId: v.optional(v.string()), enabled: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    await ctx.runMutation(discordUserStreamingMutations.setUserStreamingEnabled, {
      organizationId,
      userId,
      enabled: args.enabled,
    });
    return null;
  },
});
