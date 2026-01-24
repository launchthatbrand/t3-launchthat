import { query } from "../_generated/server";
import { resolveViewerUserId } from "../traderlaunchpad/lib/resolve";
import { v } from "convex/values";

export const getMySubscriptionRowId = query({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx) => {
    const userId = await resolveViewerUserId(ctx);
    const row = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    return row ? String(row._id) : null;
  },
});

export const listMySubscriptions = query({
  args: {},
  returns: v.array(
    v.object({
      endpoint: v.string(),
      p256dh: v.string(),
      auth: v.string(),
      expirationTime: v.optional(v.union(v.number(), v.null())),
    }),
  ),
  handler: async (ctx) => {
    const userId = await resolveViewerUserId(ctx);
    const rows = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return rows.map((r) => ({
      endpoint: r.endpoint,
      p256dh: r.p256dh,
      auth: r.auth,
      expirationTime:
        typeof r.expirationTime === "number"
          ? r.expirationTime
          : r.expirationTime === null
            ? null
            : undefined,
    }));
  },
});

