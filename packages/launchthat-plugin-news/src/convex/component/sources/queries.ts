import { v } from "convex/values";
import { query } from "../server";

export const listSources = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.id("newsSources"),
      _creationTime: v.number(),
      sourceKey: v.string(),
      kind: v.string(),
      label: v.optional(v.string()),
      enabled: v.boolean(),
      cadenceSeconds: v.number(),
      overlapSeconds: v.number(),
      nextRunAt: v.number(),
      config: v.any(),
      cursor: v.optional(v.any()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(500, Number(args.limit ?? 200)));
    const rows = await ctx.db.query("newsSources").withIndex("by_nextRunAt").take(limit);
    return Array.isArray(rows) ? rows : [];
  },
});

export const listDueSources = query({
  args: { nowMs: v.number(), limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.id("newsSources"),
      sourceKey: v.string(),
      kind: v.string(),
      label: v.optional(v.string()),
      enabled: v.boolean(),
      cadenceSeconds: v.number(),
      overlapSeconds: v.number(),
      nextRunAt: v.number(),
      config: v.any(),
      cursor: v.optional(v.any()),
    }),
  ),
  handler: async (ctx, args) => {
    const nowMs = Math.max(0, Math.floor(args.nowMs));
    const limit = Math.max(1, Math.min(200, Number(args.limit ?? 50)));
    const rows = await ctx.db
      .query("newsSources")
      .withIndex("by_nextRunAt")
      .order("asc")
      .take(limit);
    const list = Array.isArray(rows) ? rows : [];
    return list
      .filter((r) => r.enabled === true && Number(r.nextRunAt) <= nowMs)
      .slice(0, limit)
      .map((r) => ({
        _id: r._id,
        sourceKey: String((r as any).sourceKey ?? ""),
        kind: String((r as any).kind ?? ""),
        label: typeof (r as any).label === "string" ? (r as any).label : undefined,
        enabled: Boolean((r as any).enabled),
        cadenceSeconds: Number((r as any).cadenceSeconds ?? 0),
        overlapSeconds: Number((r as any).overlapSeconds ?? 0),
        nextRunAt: Number((r as any).nextRunAt ?? 0),
        config: (r as any).config,
        cursor: (r as any).cursor,
      }));
  },
});

