import { v } from "convex/values";

import { components } from "../_generated/api";
import { mutation } from "../_generated/server";
import { resolveViewerUserId } from "../traderlaunchpad/lib/resolve";

const guildSettingsMutations =
  components.launchthat_discord.guildSettings.mutations as any;
const templatesMutations = components.launchthat_discord.templates.mutations as any;
const userLinksMutations =
  components.launchthat_discord.userLinks.mutations as any;
const userStreamingMutations =
  components.launchthat_discord.userStreaming.mutations as any;
const routingMutations =
  components.launchthat_discord.routing.mutations as any;
const automationsMutations =
  components.launchthat_discord.automations.mutations as any;
const eventsMutations = components.launchthat_discord.events.mutations as any;
const orgConfigMutations =
  components.launchthat_discord.orgConfigs.mutations as any;

export const upsertGuildSettings = mutation({
  args: {
    guildId: v.string(),
    approvedMemberRoleId: v.optional(v.string()),
    supportAiEnabled: v.boolean(),
    autoJoinEnabled: v.optional(v.boolean()),
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
    inviteUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await resolveViewerUserId(ctx);
    await ctx.runMutation(guildSettingsMutations.upsertGuildSettings, {
      scope: "platform",
      organizationId: undefined,
      ...args,
    });
    return null;
  },
});

export const upsertTemplate = mutation({
  args: {
    guildId: v.optional(v.string()),
    kind: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    template: v.string(),
    templateJson: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await resolveViewerUserId(ctx);
    await ctx.runMutation(templatesMutations.upsertTemplate, {
      scope: "platform",
      organizationId: undefined,
      ...args,
    });
    return null;
  },
});

export const createTemplate = mutation({
  args: {
    guildId: v.optional(v.string()),
    kind: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    template: v.string(),
    templateJson: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    await resolveViewerUserId(ctx);
    const templateId = await ctx.runMutation(templatesMutations.createTemplate, {
      scope: "platform",
      organizationId: undefined,
      ...args,
    });
    return String(templateId);
  },
});

export const updateTemplate = mutation({
  args: {
    templateId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    template: v.optional(v.string()),
    templateJson: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await resolveViewerUserId(ctx);
    await ctx.runMutation(templatesMutations.updateTemplate, {
      scope: "platform",
      organizationId: undefined,
      ...args,
    });
    return null;
  },
});

export const deleteTemplate = mutation({
  args: {
    templateId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await resolveViewerUserId(ctx);
    await ctx.runMutation(templatesMutations.deleteTemplate, {
      scope: "platform",
      organizationId: undefined,
      ...args,
    });
    return null;
  },
});

export const unlinkMyDiscordLink = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await resolveViewerUserId(ctx);
    await ctx.runMutation(userLinksMutations.unlinkUser, {
      scope: "platform",
      organizationId: undefined,
      userId,
    });
    return null;
  },
});

export const setOrgDiscordEnabled = mutation({
  args: { organizationId: v.optional(v.string()), enabled: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await resolveViewerUserId(ctx);
    await ctx.runMutation(orgConfigMutations.setOrgEnabled, {
      scope: "platform",
      organizationId: undefined,
      enabled: args.enabled,
    });
    return null;
  },
});

export const disconnectMyDiscordStreaming = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await resolveViewerUserId(ctx);
    await ctx.runMutation(userLinksMutations.unlinkUser, {
      scope: "platform",
      organizationId: undefined,
      userId,
    });
    await ctx.runMutation(userStreamingMutations.setUserStreamingEnabled, {
      scope: "platform",
      organizationId: undefined,
      userId,
      enabled: false,
    });
    return null;
  },
});

export const setMyDiscordStreamingEnabled = mutation({
  args: { enabled: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await resolveViewerUserId(ctx);
    await ctx.runMutation(userStreamingMutations.setUserStreamingEnabled, {
      scope: "platform",
      organizationId: undefined,
      userId,
      enabled: args.enabled,
    });
    return null;
  },
});

export const upsertRoutingRuleSet = mutation({
  args: {
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
    await resolveViewerUserId(ctx);
    await ctx.runMutation(routingMutations.upsertRoutingRuleSet, {
      scope: "platform",
      organizationId: undefined,
      guildId: args.guildId,
      kind: args.kind,
      matchStrategy: args.matchStrategy,
    });
    return null;
  },
});

export const replaceRoutingRules = mutation({
  args: {
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
        channelKind: v.optional(
          v.union(v.literal("mentors"), v.literal("members")),
        ),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await resolveViewerUserId(ctx);
    await ctx.runMutation(routingMutations.replaceRoutingRules, {
      scope: "platform",
      organizationId: undefined,
      guildId: args.guildId,
      kind: args.kind,
      rules: args.rules,
    });
    return null;
  },
});

export const createAutomation = mutation({
  args: {
    guildId: v.string(),
    name: v.string(),
    enabled: v.boolean(),
    trigger: v.object({
      type: v.union(v.literal("schedule"), v.literal("event")),
      config: v.any(),
    }),
    conditions: v.optional(v.any()),
    action: v.object({
      type: v.literal("send_message"),
      config: v.any(),
    }),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    await resolveViewerUserId(ctx);
    const automationId = await ctx.runMutation(automationsMutations.createAutomation, {
      scope: "platform",
      organizationId: undefined,
      ...args,
    });
    return String(automationId);
  },
});

export const updateAutomation = mutation({
  args: {
    automationId: v.string(),
    name: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
    trigger: v.optional(
      v.object({
        type: v.union(v.literal("schedule"), v.literal("event")),
        config: v.any(),
      }),
    ),
    conditions: v.optional(v.any()),
    action: v.optional(
      v.object({
        type: v.literal("send_message"),
        config: v.any(),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await resolveViewerUserId(ctx);
    await ctx.runMutation(automationsMutations.updateAutomation, {
      scope: "platform",
      organizationId: undefined,
      ...args,
    });
    return null;
  },
});

export const deleteAutomation = mutation({
  args: {
    automationId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await resolveViewerUserId(ctx);
    await ctx.runMutation(automationsMutations.deleteAutomation, {
      scope: "platform",
      organizationId: undefined,
      ...args,
    });
    return null;
  },
});

export const markAutomationRun = mutation({
  args: {
    automationId: v.string(),
    lastRunAt: v.optional(v.number()),
    nextRunAt: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await resolveViewerUserId(ctx);
    await ctx.runMutation(automationsMutations.markAutomationRun, {
      scope: "platform",
      organizationId: undefined,
      ...args,
    });
    return null;
  },
});

export const emitEvent = mutation({
  args: {
    guildId: v.optional(v.string()),
    eventKey: v.string(),
    payloadJson: v.string(),
    dedupeKey: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await resolveViewerUserId(ctx);
    await ctx.runMutation(eventsMutations.emitEvent, {
      scope: "platform",
      organizationId: undefined,
      guildId: args.guildId,
      eventKey: args.eventKey,
      payloadJson: args.payloadJson,
      dedupeKey: args.dedupeKey,
    });
    return null;
  },
});
