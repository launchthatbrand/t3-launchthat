import { v } from "convex/values";

import { query } from "../server";

const norm = (s: unknown): string => (typeof s === "string" ? s.trim() : "");

export const listRecentEvents = query({
  args: {
    organizationId: v.string(),
    guildId: v.optional(v.string()),
    eventKey: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      id: v.string(),
      organizationId: v.string(),
      guildId: v.optional(v.string()),
      eventKey: v.string(),
      payloadJson: v.string(),
      dedupeKey: v.optional(v.string()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const organizationId = norm(args.organizationId);
    const guildId = norm(args.guildId);
    const eventKey = norm(args.eventKey);
    const limitRaw = typeof args.limit === "number" ? args.limit : 50;
    const limit = Math.max(1, Math.min(200, Math.floor(limitRaw)));

    if (!organizationId) return [];

    const rows = await (guildId && eventKey
      ? ctx.db
          .query("discordEvents")
          .withIndex("by_organizationId_and_guildId_and_eventKey_and_createdAt", (q: any) =>
            q
              .eq("organizationId", organizationId)
              .eq("guildId", guildId)
              .eq("eventKey", eventKey),
          )
          .order("desc")
          .take(limit)
      : eventKey
        ? ctx.db
            .query("discordEvents")
            .withIndex("by_organizationId_and_eventKey_and_createdAt", (q: any) =>
              q.eq("organizationId", organizationId).eq("eventKey", eventKey),
            )
            .order("desc")
            .take(limit)
        : ctx.db
            .query("discordEvents")
            .withIndex("by_organizationId_and_createdAt", (q: any) =>
              q.eq("organizationId", organizationId),
            )
            .order("desc")
            .take(limit));

    return (rows ?? []).map((row: any) => ({
      id: String(row._id),
      organizationId: String(row.organizationId ?? ""),
      guildId: typeof row.guildId === "string" ? row.guildId : undefined,
      eventKey: String(row.eventKey ?? ""),
      payloadJson: String(row.payloadJson ?? ""),
      dedupeKey: typeof row.dedupeKey === "string" ? row.dedupeKey : undefined,
      createdAt: Number(row.createdAt ?? 0),
    }));
  },
});

