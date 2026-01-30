import { v } from "convex/values";

import { mutation } from "../server";

export const upsertRoutingRuleSet = mutation({
  args: {
    scope: v.optional(v.union(v.literal("org"), v.literal("platform"))),
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
    const now = Date.now();
    const scope = args.scope ?? "org";
    const organizationId = typeof args.organizationId === "string" ? args.organizationId : undefined;
    if (scope === "org" && !organizationId) {
      throw new Error("organizationId is required when scope=org");
    }
    const existing = await ctx.db
      .query("routingRuleSets")
      .withIndex("by_scope_and_organizationId_and_guildId_and_kind", (q: any) =>
        q.eq("scope", scope).eq("organizationId", organizationId).eq("guildId", args.guildId).eq("kind", args.kind),
      )
      .unique();

    const patch = {
      scope,
      organizationId,
      guildId: args.guildId,
      kind: args.kind,
      matchStrategy: args.matchStrategy,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch((existing as any)._id, patch);
      return null;
    }
    await ctx.db.insert("routingRuleSets", patch);
    return null;
  },
});

export const replaceRoutingRules = mutation({
  args: {
    scope: v.optional(v.union(v.literal("org"), v.literal("platform"))),
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
        // Optional legacy field; if present, it enables legacy fallback compatibility.
        channelKind: v.optional(
          v.union(v.literal("mentors"), v.literal("members")),
        ),
      }),
    ),
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
      .query("routingRules")
      .withIndex("by_scope_and_organizationId_and_guildId_and_kind", (q: any) =>
        q.eq("scope", scope).eq("organizationId", organizationId).eq("guildId", args.guildId).eq("kind", args.kind),
      )
      .collect();

    for (const row of existing) {
      await ctx.db.delete((row as any)._id);
    }

    for (const rule of args.rules) {
      await ctx.db.insert("routingRules", {
        scope,
        organizationId,
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

