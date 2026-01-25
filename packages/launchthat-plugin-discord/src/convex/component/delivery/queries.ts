import { v } from "convex/values";

import { query } from "../server";

const toDateKeyUtc = (ms: number): string => {
  try {
    const d = new Date(ms);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return "";
  }
};

export const getUserDeliveryStats = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    kind: v.optional(v.string()),
    daysBack: v.optional(v.number()),
  },
  returns: v.object({
    daysBack: v.number(),
    totalMessagesSent: v.number(),
    byDay: v.array(v.object({ day: v.string(), messagesSent: v.number() })),
  }),
  handler: async (ctx, args) => {
    const daysBackRaw = typeof args.daysBack === "number" ? args.daysBack : 30;
    const daysBack = Math.max(1, Math.min(180, Math.floor(daysBackRaw)));
    const fromMs = Date.now() - daysBack * 24 * 60 * 60 * 1000;
    const fromDay = toDateKeyUtc(fromMs);
    const kind = typeof args.kind === "string" && args.kind.trim() ? args.kind.trim() : null;

    const q = ctx.db
      .query("userDeliveryStats")
      .withIndex("by_organizationId_and_userId_and_day", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .gte("day", fromDay),
      )
      .order("desc");

    const byDayCount = new Map<string, number>();
    let totalMessagesSent = 0;

    for await (const row of q) {
      const rowKind = typeof (row as any).kind === "string" ? (row as any).kind : "";
      if (kind && rowKind !== kind) continue;
      const day = typeof (row as any).day === "string" ? (row as any).day : "";
      const messagesSent =
        typeof (row as any).messagesSent === "number" ? (row as any).messagesSent : 0;
      if (!day) continue;
      byDayCount.set(day, (byDayCount.get(day) ?? 0) + messagesSent);
      totalMessagesSent += messagesSent;
    }

    const byDay = Array.from(byDayCount.entries())
      .map(([day, messagesSent]) => ({ day, messagesSent }))
      .sort((a, b) => a.day.localeCompare(b.day));

    return { daysBack, totalMessagesSent, byDay };
  },
});

