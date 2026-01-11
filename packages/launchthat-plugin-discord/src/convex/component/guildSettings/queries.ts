import { v } from "convex/values";

import { query } from "../server";

export const getGuildSettings = query({
  args: { organizationId: v.string(), guildId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
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
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("guildSettings")
      .withIndex("by_organizationId_and_guildId", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("guildId", args.guildId),
      )
      .first();
    if (!row) return null;
    return {
      organizationId: String((row as any).organizationId ?? ""),
      guildId: String((row as any).guildId ?? ""),
      supportAiEnabled: Boolean((row as any).supportAiEnabled),
      supportForumChannelId:
        typeof (row as any).supportForumChannelId === "string"
          ? ((row as any).supportForumChannelId as string)
          : undefined,
      supportStaffRoleId:
        typeof (row as any).supportStaffRoleId === "string"
          ? ((row as any).supportStaffRoleId as string)
          : undefined,
      escalationKeywords: Array.isArray((row as any).escalationKeywords)
        ? ((row as any).escalationKeywords as unknown[]).filter(
            (v) => typeof v === "string",
          ) as string[]
        : undefined,
      escalationConfidenceThreshold:
        typeof (row as any).escalationConfidenceThreshold === "number"
          ? ((row as any).escalationConfidenceThreshold as number)
          : undefined,
      threadReplyCooldownMs:
        typeof (row as any).threadReplyCooldownMs === "number"
          ? ((row as any).threadReplyCooldownMs as number)
          : undefined,
      supportAiDisabledMessageEnabled:
        typeof (row as any).supportAiDisabledMessageEnabled === "boolean"
          ? ((row as any).supportAiDisabledMessageEnabled as boolean)
          : undefined,
      supportAiDisabledMessageText:
        typeof (row as any).supportAiDisabledMessageText === "string"
          ? ((row as any).supportAiDisabledMessageText as string)
          : undefined,
      courseUpdatesChannelId:
        typeof (row as any).courseUpdatesChannelId === "string"
          ? ((row as any).courseUpdatesChannelId as string)
          : undefined,
      updatedAt: Number((row as any).updatedAt ?? 0),
    };
  },
});


