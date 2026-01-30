import { v } from "convex/values";

import { mutation } from "../server";

const norm = (s: unknown): string => (typeof s === "string" ? s.trim() : "");

export const emitEvent = mutation({
  args: {
    scope: v.optional(v.union(v.literal("org"), v.literal("platform"))),
    organizationId: v.optional(v.string()),
    guildId: v.optional(v.string()),
    eventKey: v.string(),
    payloadJson: v.string(),
    dedupeKey: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const scope = args.scope ?? "org";
    const organizationId = norm(args.organizationId);
    const guildId = norm(args.guildId);
    const eventKey = norm(args.eventKey);
    const payloadJson = typeof args.payloadJson === "string" ? args.payloadJson : "";
    const dedupeKey = norm(args.dedupeKey);

    if (scope === "org" && !organizationId) throw new Error("Missing organizationId");
    if (!eventKey) throw new Error("Missing eventKey");
    if (!payloadJson) throw new Error("Missing payloadJson");

    if (dedupeKey) {
      const existing = await ctx.db
        .query("discordEvents")
        .withIndex(
          scope === "org" ? "by_organizationId_and_dedupeKey" : "by_scope_and_dedupeKey",
          (q: any) =>
            scope === "org"
              ? q.eq("organizationId", organizationId).eq("dedupeKey", dedupeKey)
              : q.eq("scope", scope).eq("dedupeKey", dedupeKey),
        )
        .unique();
      if (existing) return null;
    }

    await ctx.db.insert("discordEvents", {
      scope,
      organizationId,
      guildId: guildId || undefined,
      eventKey,
      payloadJson,
      dedupeKey: dedupeKey || undefined,
      createdAt: Date.now(),
    });
    return null;
  },
});

