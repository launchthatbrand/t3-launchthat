import { v } from "convex/values";

import { query } from "../server";

const norm = (s: unknown): string => (typeof s === "string" ? s.trim() : "");

const normalizeRow = (row: any) => ({
  id: String(row._id),
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
    guildId: v.string(),
  },
  returns: v.array(
    v.object({
      id: v.string(),
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
    const guildId = norm(args.guildId);
    if (!guildId) return [];

    const rows = await ctx.db
      .query("platformDiscordAutomations")
      .withIndex("by_guildId", (q: any) => q.eq("guildId", guildId))
      .order("desc")
      .collect();

    return (rows ?? []).map(normalizeRow).sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const listDueAutomations = query({
  args: {
    now: v.number(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      id: v.string(),
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
    if (!Number.isFinite(now)) return [];

    const rows = await ctx.db
      .query("platformDiscordAutomations")
      .withIndex("by_enabled_and_nextRunAt", (q: any) =>
        q.eq("enabled", true).lte("nextRunAt", now),
      )
      .order("asc")
      .take(limit);

    return (rows ?? []).map(normalizeRow);
  },
});
