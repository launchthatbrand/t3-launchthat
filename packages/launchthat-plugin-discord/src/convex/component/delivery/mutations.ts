import { v } from "convex/values";

import { mutation } from "../server";

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

export const incrementUserDeliveryStat = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    kind: v.string(), // e.g. "trade_stream"
    messagesSent: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const day = toDateKeyUtc(now);
    if (!day) return null;

    const delta = typeof args.messagesSent === "number" ? Math.floor(args.messagesSent) : 1;
    const inc = Math.max(0, delta);
    if (inc <= 0) return null;

    const existing = await ctx.db
      .query("userDeliveryStats")
      .withIndex("by_organizationId_and_userId_and_kind_and_day", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("kind", args.kind)
          .eq("day", day),
      )
      .unique();

    if (existing) {
      const prev = typeof (existing as any).messagesSent === "number" ? (existing as any).messagesSent : 0;
      await ctx.db.patch((existing as any)._id, {
        messagesSent: prev + inc,
        updatedAt: now,
      });
      return null;
    }

    await ctx.db.insert("userDeliveryStats", {
      organizationId: args.organizationId,
      userId: args.userId,
      kind: args.kind,
      day,
      messagesSent: inc,
      updatedAt: now,
    });
    return null;
  },
});

