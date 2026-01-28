import { v } from "convex/values";
import { query } from "../server";

export const listRecentRuns = query({
  args: {
    limit: v.optional(v.number()),
    sourceKey: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("newsIngestRuns"),
      _creationTime: v.number(),
      sourceId: v.id("newsSources"),
      sourceKey: v.string(),
      kind: v.string(),
      startedAt: v.number(),
      endedAt: v.optional(v.number()),
      ok: v.optional(v.boolean()),
      createdRaw: v.optional(v.number()),
      dedupedEvents: v.optional(v.number()),
      createdEvents: v.optional(v.number()),
      updatedEvents: v.optional(v.number()),
      symbolLinksWritten: v.optional(v.number()),
      lastError: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(500, Number(args.limit ?? 200)));
    const sourceKey =
      typeof args.sourceKey === "string" ? args.sourceKey.trim() : "";

    const q = sourceKey
      ? ctx.db
          .query("newsIngestRuns")
          .withIndex("by_sourceKey_and_startedAt", (q2) =>
            (q2 as any).eq("sourceKey", sourceKey),
          )
      : ctx.db.query("newsIngestRuns").withIndex("by_startedAt");

    const rows = await q.order("desc").take(limit);
    return Array.isArray(rows) ? rows : [];
  },
});

