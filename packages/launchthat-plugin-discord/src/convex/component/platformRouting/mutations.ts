import { v } from "convex/values";

import { mutation } from "../server";

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
    const now = Date.now();
    const existing = await ctx.db
      .query("platformRoutingRuleSets")
      .withIndex("by_guildId_and_kind", (q: any) =>
        q.eq("guildId", args.guildId).eq("kind", args.kind),
      )
      .unique();

    const patch = {
      guildId: args.guildId,
      kind: args.kind,
      matchStrategy: args.matchStrategy,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch((existing as any)._id, patch);
      return null;
    }
    await ctx.db.insert("platformRoutingRuleSets", patch);
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
    const now = Date.now();

    const existing = await ctx.db
      .query("platformRoutingRules")
      .withIndex("by_guildId_and_kind", (q: any) =>
        q.eq("guildId", args.guildId).eq("kind", args.kind),
      )
      .collect();

    for (const row of existing) {
      await ctx.db.delete((row as any)._id);
    }

    for (const rule of args.rules) {
      await ctx.db.insert("platformRoutingRules", {
        guildId: args.guildId,
        kind: args.kind,
        channelKind: rule.channelKind,
        channelId: rule.channelId,
        enabled: rule.enabled,
        order: rule.order,
        priority: rule.priority,
        conditions: rule.conditions,
        updatedAt: now,
      });
    }

    return null;
  },
});
