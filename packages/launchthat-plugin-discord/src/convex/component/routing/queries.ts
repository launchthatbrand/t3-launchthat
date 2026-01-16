import { v } from "convex/values";

import { query } from "../server";

export const resolveTradeFeedChannel = query({
  args: {
    organizationId: v.string(),
    guildId: v.string(),
    channelKind: v.union(v.literal("mentors"), v.literal("members")),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const rule = await ctx.db
      .query("routingRules")
      .withIndex(
        "by_organizationId_and_guildId_and_kind_and_channelKind",
        (q: any) =>
          q
            .eq("organizationId", args.organizationId)
            .eq("guildId", args.guildId)
            .eq("kind", "trade_feed")
            .eq("channelKind", args.channelKind),
      )
      .unique();

    if (rule?.enabled && typeof rule.channelId === "string") {
      return rule.channelId.trim() || null;
    }

    const settings = await ctx.db
      .query("guildSettings")
      .withIndex("by_organizationId_and_guildId", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("guildId", args.guildId),
      )
      .unique();

    if (!settings) return null;

    const channelId =
      args.channelKind === "mentors"
        ? typeof settings.mentorTradesChannelId === "string"
          ? settings.mentorTradesChannelId.trim()
          : ""
        : typeof settings.memberTradesChannelId === "string"
          ? settings.memberTradesChannelId.trim()
          : "";

    return channelId || null;
  },
});
