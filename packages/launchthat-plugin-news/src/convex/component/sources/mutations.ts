import { v } from "convex/values";
import { mutation } from "../server";

const clampCadenceSeconds = (raw: number): number => {
  if (!Number.isFinite(raw)) return 300;
  return Math.max(30, Math.min(24 * 60 * 60, Math.floor(raw)));
};

const clampOverlapSeconds = (raw: number): number => {
  if (!Number.isFinite(raw)) return 300;
  return Math.max(0, Math.min(24 * 60 * 60, Math.floor(raw)));
};

export const createSource = mutation({
  args: {
    sourceKey: v.string(),
    kind: v.string(),
    label: v.optional(v.string()),
    cadenceSeconds: v.optional(v.number()),
    overlapSeconds: v.optional(v.number()),
    enabled: v.optional(v.boolean()),
    config: v.any(),
  },
  returns: v.object({ sourceId: v.id("newsSources") }),
  handler: async (ctx, args) => {
    const sourceKey = args.sourceKey.trim();
    if (!sourceKey) throw new Error("Missing sourceKey");
    const kind = args.kind.trim();
    if (!kind) throw new Error("Missing kind");

    const existing = await ctx.db
      .query("newsSources")
      .withIndex("by_sourceKey", (q) => q.eq("sourceKey", sourceKey))
      .first();
    if (existing) return { sourceId: existing._id };

    const now = Date.now();
    const cadenceSeconds = clampCadenceSeconds(Number(args.cadenceSeconds ?? 300));
    const overlapSeconds = clampOverlapSeconds(Number(args.overlapSeconds ?? 300));
    const enabled = args.enabled !== false;
    const sourceId = await ctx.db.insert("newsSources", {
      sourceKey,
      kind,
      label: typeof args.label === "string" ? args.label : undefined,
      enabled,
      cadenceSeconds,
      overlapSeconds,
      nextRunAt: now,
      config: args.config,
      cursor: undefined,
      createdAt: now,
      updatedAt: now,
    });
    return { sourceId };
  },
});

export const updateSource = mutation({
  args: {
    sourceId: v.id("newsSources"),
    label: v.optional(v.string()),
    cadenceSeconds: v.optional(v.number()),
    overlapSeconds: v.optional(v.number()),
    enabled: v.optional(v.boolean()),
    config: v.optional(v.any()),
    cursor: v.optional(v.any()),
    nextRunAt: v.optional(v.number()),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.sourceId);
    if (!row) throw new Error("Source not found");
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.label !== undefined) patch.label = args.label;
    if (args.cadenceSeconds !== undefined)
      patch.cadenceSeconds = clampCadenceSeconds(Number(args.cadenceSeconds));
    if (args.overlapSeconds !== undefined)
      patch.overlapSeconds = clampOverlapSeconds(Number(args.overlapSeconds));
    if (args.enabled !== undefined) patch.enabled = Boolean(args.enabled);
    if (args.config !== undefined) patch.config = args.config;
    if (args.cursor !== undefined) patch.cursor = args.cursor;
    if (args.nextRunAt !== undefined) patch.nextRunAt = Number(args.nextRunAt);
    await ctx.db.patch(args.sourceId, patch);
    return { ok: true };
  },
});

export const deleteSource = mutation({
  args: { sourceId: v.id("newsSources") },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.sourceId);
    if (!row) return { ok: true };
    await ctx.db.delete(args.sourceId);
    return { ok: true };
  },
});

