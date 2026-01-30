import { v } from "convex/values";

import { query } from "../server";
import { resolveChannelsForEventFromRules } from "../../../runtime/routing";

const resolveTradeFeedChannelLegacy = async (
  ctx: any,
  args: {
    scope: "org" | "platform";
    organizationId?: string;
    guildId: string;
    channelKind: "mentors" | "members";
  },
): Promise<string | null> => {
  const rule = await ctx.db
    .query("routingRules")
    .withIndex(
      "by_scope_and_guildId_and_kind_and_channelKind",
      (q: any) =>
        q
          .eq("scope", args.scope)
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
    .withIndex("by_scope_and_organizationId_and_guildId", (q: any) =>
      q.eq("scope", args.scope).eq("organizationId", args.organizationId).eq("guildId", args.guildId),
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
};

export const resolveTradeFeedChannel = query({
  args: {
    scope: v.optional(v.union(v.literal("org"), v.literal("platform"))),
    organizationId: v.optional(v.string()),
    guildId: v.string(),
    channelKind: v.union(v.literal("mentors"), v.literal("members")),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const scope = (args.scope ?? "org") as "org" | "platform";
    const organizationId =
      typeof args.organizationId === "string" ? args.organizationId : undefined;
    if (scope === "org" && !organizationId) return null;
    return await resolveTradeFeedChannelLegacy(ctx, {
      ...args,
      scope,
      organizationId,
    });
  },
});

export const getRoutingRuleSet = query({
  args: {
    scope: v.optional(v.union(v.literal("org"), v.literal("platform"))),
    organizationId: v.optional(v.string()),
    guildId: v.string(),
    kind: v.union(v.literal("trade_feed")),
  },
  returns: v.union(
    v.null(),
    v.object({
      scope: v.union(v.literal("org"), v.literal("platform")),
      organizationId: v.optional(v.string()),
      guildId: v.string(),
      kind: v.union(v.literal("trade_feed")),
      matchStrategy: v.union(
        v.literal("first_match"),
        v.literal("multi_cast"),
        v.literal("priority"),
      ),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const scope = args.scope ?? "org";
    const organizationId = typeof args.organizationId === "string" ? args.organizationId : undefined;
    if (scope === "org" && !organizationId) return null;
    const row = await ctx.db
      .query("routingRuleSets")
      .withIndex("by_scope_and_organizationId_and_guildId_and_kind", (q: any) =>
        q.eq("scope", scope).eq("organizationId", organizationId).eq("guildId", args.guildId).eq("kind", args.kind),
      )
      .unique();
    if (!row) return null;
    return {
      scope: (row as any).scope === "platform" ? ("platform" as const) : ("org" as const),
      organizationId: (row as any).organizationId,
      guildId: String((row as any).guildId ?? ""),
      kind: "trade_feed" as const,
      matchStrategy:
        (row as any).matchStrategy === "multi_cast"
          ? ("multi_cast" as const)
          : (row as any).matchStrategy === "priority"
            ? ("priority" as const)
            : ("first_match" as const),
      updatedAt: Number((row as any).updatedAt ?? 0),
    };
  },
});

export const listRoutingRules = query({
  args: {
    scope: v.optional(v.union(v.literal("org"), v.literal("platform"))),
    organizationId: v.optional(v.string()),
    guildId: v.string(),
    kind: v.union(v.literal("trade_feed")),
  },
  returns: v.array(
    v.object({
      id: v.string(),
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
  handler: async (ctx, args) => {
    const scope = args.scope ?? "org";
    const organizationId = typeof args.organizationId === "string" ? args.organizationId : undefined;
    if (scope === "org" && !organizationId) return [];
    const rows = await ctx.db
      .query("routingRules")
      .withIndex("by_scope_and_organizationId_and_guildId_and_kind", (q: any) =>
        q.eq("scope", scope).eq("organizationId", organizationId).eq("guildId", args.guildId).eq("kind", args.kind),
      )
      .collect();

    const normalized = rows.map((row: any) => ({
      id: String(row._id),
      enabled: Boolean(row.enabled),
      channelId: String(row.channelId ?? ""),
      order: typeof row.order === "number" ? row.order : 0,
      priority: typeof row.priority === "number" ? row.priority : 0,
      conditions:
        row.conditions && typeof row.conditions === "object"
          ? {
              actorRoles: Array.isArray(row.conditions.actorRoles)
                ? row.conditions.actorRoles.filter((s: any) => typeof s === "string")
                : undefined,
              symbols: Array.isArray(row.conditions.symbols)
                ? row.conditions.symbols.filter((s: any) => typeof s === "string")
                : undefined,
            }
          : undefined,
    }));

    normalized.sort((a, b) => a.order - b.order);
    return normalized;
  },
});

export const resolveChannelsForEvent = query({
  args: {
    scope: v.optional(v.union(v.literal("org"), v.literal("platform"))),
    organizationId: v.optional(v.string()),
    guildId: v.string(),
    kind: v.union(v.literal("trade_feed")),
    actorRole: v.string(),
    symbol: v.string(),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const scope = args.scope ?? "org";
    const organizationId = typeof args.organizationId === "string" ? args.organizationId : undefined;
    if (scope === "org" && !organizationId) return [];
    const ruleSet = await ctx.db
      .query("routingRuleSets")
      .withIndex("by_scope_and_organizationId_and_guildId_and_kind", (q: any) =>
        q.eq("scope", scope).eq("organizationId", organizationId).eq("guildId", args.guildId).eq("kind", args.kind),
      )
      .unique();

    const matchStrategy: "first_match" | "multi_cast" | "priority" =
      (ruleSet as any)?.matchStrategy === "multi_cast"
        ? "multi_cast"
        : (ruleSet as any)?.matchStrategy === "priority"
          ? "priority"
          : "first_match";

    const rules = await ctx.db
      .query("routingRules")
      .withIndex("by_scope_and_organizationId_and_guildId_and_kind", (q: any) =>
        q.eq("scope", scope).eq("organizationId", organizationId).eq("guildId", args.guildId).eq("kind", args.kind),
      )
      .collect();

    const normalized = (rules ?? [])
      .map((row: any) => ({
        enabled: Boolean(row.enabled),
        channelId: typeof row.channelId === "string" ? row.channelId.trim() : "",
        order: typeof row.order === "number" ? row.order : 0,
        priority: typeof row.priority === "number" ? row.priority : 0,
        actorRoles: Array.isArray(row.conditions?.actorRoles)
          ? row.conditions.actorRoles.filter((s: any) => typeof s === "string")
          : null,
        symbols: Array.isArray(row.conditions?.symbols)
          ? row.conditions.symbols
              .filter((s: any) => typeof s === "string")
              .map((s: string) => s.trim().toUpperCase())
              .filter(Boolean)
          : null,
      }))
      .filter((r) => r.enabled && Boolean(r.channelId));

    const resolved = resolveChannelsForEventFromRules({
      matchStrategy,
      rules: normalized,
      actorRole: String(args.actorRole ?? ""),
      symbol: String(args.symbol ?? ""),
    });

    if (resolved.length > 0) return resolved;

    // Fallback: legacy role-based channels (mentors/members)
    const actorRole = String(args.actorRole ?? "").trim();
    const legacyKind: "mentors" | "members" =
      actorRole === "owner" || actorRole === "admin" || actorRole === "editor"
        ? "mentors"
        : "members";
    const legacy = await resolveTradeFeedChannelLegacy(ctx, {
      organizationId: args.organizationId,
      guildId: args.guildId,
      channelKind: legacyKind,
    });
    return legacy ? [legacy] : [];
  },
});
