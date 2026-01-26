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
const discordRoutingMutations = components.launchthat_discord.routing.mutations as any;
const discordAutomationsMutations = components.launchthat_discord.automations
  .mutations as any;
const discordEventsMutations = components.launchthat_discord.events.mutations as any;

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
    templateJson: v.optional(v.string()),
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
    templateJson: v.optional(v.string()),
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
    templateJson: v.optional(v.string()),
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

export const upsertRoutingRuleSet = mutation({
  args: {
    organizationId: v.optional(v.string()),
    guildId: v.string(),
    kind: v.union(v.literal("trade_feed")),
    matchStrategy: v.union(
      v.literal("first_match"),
      v.literal("multi_cast"),
      v.literal("priority"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
    await resolveViewerUserId(ctx);
    await ctx.runMutation(discordRoutingMutations.upsertRoutingRuleSet, {
      organizationId,
      guildId: args.guildId,
      kind: args.kind,
      matchStrategy: args.matchStrategy,
    });
    return null;
  },
});

export const replaceRoutingRules = mutation({
  args: {
    organizationId: v.optional(v.string()),
    guildId: v.string(),
    kind: v.union(v.literal("trade_feed")),
    rules: v.array(
      v.object({
        enabled: v.boolean(),
        channelId: v.string(),
        order: v.number(),
        priority: v.number(),
        conditions: v.optional(
          v.object({
            actorRoles: v.optional(v.array(v.string())),
            symbols: v.optional(v.array(v.string())),
          }),
        ),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
    await resolveViewerUserId(ctx);
    await ctx.runMutation(discordRoutingMutations.replaceRoutingRules, {
      organizationId,
      guildId: args.guildId,
      kind: args.kind,
      rules: args.rules,
    });
    return null;
  },
});

export const createAutomation = mutation({
  args: {
    organizationId: v.optional(v.string()),
    guildId: v.string(),
    name: v.string(),
    enabled: v.boolean(),
    trigger: v.any(),
    conditions: v.optional(v.any()),
    action: v.any(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
    await resolveViewerUserId(ctx);
    const id = await ctx.runMutation(discordAutomationsMutations.createAutomation, {
      organizationId,
      guildId: args.guildId,
      name: args.name,
      enabled: args.enabled,
      trigger: args.trigger,
      conditions: args.conditions,
      action: args.action,
    });
    return String(id);
  },
});

export const updateAutomation = mutation({
  args: {
    organizationId: v.optional(v.string()),
    automationId: v.string(),
    name: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
    trigger: v.optional(v.any()),
    conditions: v.optional(v.any()),
    action: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
    await resolveViewerUserId(ctx);
    await ctx.runMutation(discordAutomationsMutations.updateAutomation, {
      organizationId,
      automationId: args.automationId as any,
      name: args.name,
      enabled: args.enabled,
      trigger: args.trigger,
      conditions: args.conditions,
      action: args.action,
    });
    return null;
  },
});

export const deleteAutomation = mutation({
  args: {
    organizationId: v.optional(v.string()),
    automationId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
    await resolveViewerUserId(ctx);
    await ctx.runMutation(discordAutomationsMutations.deleteAutomation, {
      organizationId,
      automationId: args.automationId as any,
    });
    return null;
  },
});

export const markAutomationRun = mutation({
  args: {
    organizationId: v.optional(v.string()),
    automationId: v.string(),
    lastRunAt: v.optional(v.number()),
    nextRunAt: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
    await resolveViewerUserId(ctx);
    await ctx.runMutation(discordAutomationsMutations.markAutomationRun, {
      organizationId,
      automationId: args.automationId as any,
      lastRunAt: args.lastRunAt,
      nextRunAt: args.nextRunAt,
      cursor: args.cursor,
    });
    return null;
  },
});

export const emitDiscordEvent = mutation({
  args: {
    organizationId: v.optional(v.string()),
    guildId: v.optional(v.string()),
    eventKey: v.string(),
    payloadJson: v.string(),
    dedupeKey: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
    await resolveViewerUserId(ctx);
    await ctx.runMutation(discordEventsMutations.emitEvent, {
      organizationId,
      guildId: args.guildId,
      eventKey: args.eventKey,
      payloadJson: args.payloadJson,
      dedupeKey: args.dedupeKey,
    });
    return null;
  },
});
