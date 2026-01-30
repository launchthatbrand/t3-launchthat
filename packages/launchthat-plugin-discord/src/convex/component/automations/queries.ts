import { v } from "convex/values";

import { query } from "../server";

const norm = (s: unknown): string => (typeof s === "string" ? s.trim() : "");

const normalizeRow = (row: any) => ({
  id: String(row._id),
  organizationId: String(row.organizationId ?? ""),
  guildId: String(row.guildId ?? ""),
  name: typeof row.name === "string" ? row.name : "",
  enabled: Boolean(row.enabled),
  trigger: row.trigger,
  conditions: row.conditions,
  action: row.action,
  state: row.state,
  nextRunAt: typeof row.nextRunAt === "number" ? row.nextRunAt : undefined,
  createdAt: typeof row.createdAt === "number" ? row.createdAt : 0,
  updatedAt: typeof row.updatedAt === "number" ? row.updatedAt : 0,
});

export const listAutomations = query({
  args: {
    scope: v.optional(v.union(v.literal("org"), v.literal("platform"))),
    organizationId: v.optional(v.string()),
    guildId: v.string(),
  },
  returns: v.array(
    v.object({
      id: v.string(),
      scope: v.union(v.literal("org"), v.literal("platform")),
      organizationId: v.optional(v.string()),
      guildId: v.string(),
      name: v.string(),
      enabled: v.boolean(),
      trigger: v.any(),
      conditions: v.optional(v.any()),
      action: v.any(),
      state: v.optional(v.any()),
      nextRunAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const scope = args.scope ?? "org";
    const organizationId = norm(args.organizationId);
    const guildId = norm(args.guildId);
    if (!guildId) return [];
    if (scope === "org" && !organizationId) return [];

    const rows = await ctx.db
      .query("discordAutomations")
      .withIndex("by_scope_and_guildId", (q: any) =>
        q.eq("scope", scope).eq("guildId", guildId),
      )
      .order("desc")
      .collect();

    return (rows ?? [])
      .map((row: any) => ({
        ...normalizeRow(row),
        scope: row.scope === "platform" ? ("platform" as const) : ("org" as const),
        organizationId: row.organizationId,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const listDueAutomations = query({
  args: {
    scope: v.optional(v.union(v.literal("org"), v.literal("platform"))),
    organizationId: v.optional(v.string()),
    now: v.number(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      id: v.string(),
      organizationId: v.string(),
      guildId: v.string(),
      name: v.string(),
      enabled: v.boolean(),
      trigger: v.any(),
      conditions: v.optional(v.any()),
      action: v.any(),
      state: v.optional(v.any()),
      nextRunAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const now = Number(args.now);
    const limitRaw = typeof args.limit === "number" ? args.limit : 50;
    const limit = Math.max(1, Math.min(200, Math.floor(limitRaw)));
    const scope = args.scope ?? "org";
    const organizationId = norm(args.organizationId);
    if (!Number.isFinite(now)) return [];

    const rows = await (scope === "org" && organizationId
      ? ctx.db
          .query("discordAutomations")
          .withIndex("by_organizationId_and_enabled_and_nextRunAt", (q: any) =>
            q.eq("organizationId", organizationId).eq("enabled", true).lte("nextRunAt", now),
          )
          .order("asc")
          .take(limit)
      : ctx.db
          .query("discordAutomations")
          .withIndex("by_scope_and_enabled_and_nextRunAt", (q: any) =>
            q.eq("scope", scope).eq("enabled", true).lte("nextRunAt", now),
          )
          .order("asc")
          .take(limit));

    return (rows ?? []).map((row: any) => ({
      ...normalizeRow(row),
      scope: row.scope === "platform" ? ("platform" as const) : ("org" as const),
      organizationId: row.organizationId,
    }));
  },
});

