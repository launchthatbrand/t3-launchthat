import { v } from "convex/values";

import { mutation } from "../server";

const norm = (s: unknown): string => (typeof s === "string" ? s.trim() : "");

export const emitEvent = mutation({
  args: {
    guildId: v.optional(v.string()),
    eventKey: v.string(),
    payloadJson: v.string(),
    dedupeKey: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const guildId = norm(args.guildId);
    const eventKey = norm(args.eventKey);
    const payloadJson = typeof args.payloadJson === "string" ? args.payloadJson : "";
    const dedupeKey = norm(args.dedupeKey);

    if (!eventKey) throw new Error("Missing eventKey");
    if (!payloadJson) throw new Error("Missing payloadJson");

    if (dedupeKey) {
      const existing = await ctx.db
        .query("platformDiscordEvents")
        .withIndex("by_dedupeKey", (q: any) => q.eq("dedupeKey", dedupeKey))
        .unique();
      if (existing) return null;
    }

    await ctx.db.insert("platformDiscordEvents", {
      guildId: guildId || undefined,
      eventKey,
      payloadJson,
      dedupeKey: dedupeKey || undefined,
      createdAt: Date.now(),
    });
    return null;
  },
});
