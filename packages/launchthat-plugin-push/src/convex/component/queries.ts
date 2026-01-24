import { v } from "convex/values";

import { query } from "./server";
import { resolveViewerUserId } from "./lib";

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
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

export const getMySubscriptionRowId = query({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx) => {
    const userId = await resolveViewerUserId(ctx);
    const row = await ctx.db
      .query("pushSubscriptions")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .first();
    return row ? String(row._id) : null;
  },
});

export const listSubscriptionsByUserId = query({
  args: { userId: v.string() },
  returns: v.array(
    v.object({
      endpoint: v.string(),
      p256dh: v.string(),
      auth: v.string(),
      expirationTime: v.optional(v.union(v.number(), v.null())),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = args.userId.trim();
    if (!userId) return [];
    const rows = await ctx.db
      .query("pushSubscriptions")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
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

