import { v } from "convex/values";

import { mutation } from "./server";
import { resolveViewerUserId } from "./lib";

const subscriptionValidator = v.object({
  endpoint: v.string(),
  expirationTime: v.optional(v.union(v.number(), v.null())),
  keys: v.object({
    p256dh: v.string(),
    auth: v.string(),
  }),
});

export const upsertMyPushSubscription = mutation({
  args: {
    subscription: subscriptionValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await resolveViewerUserId(ctx);

    const endpoint = args.subscription.endpoint.trim();
    const p256dh = args.subscription.keys.p256dh.trim();
    const auth = args.subscription.keys.auth.trim();
    if (!endpoint || !p256dh || !auth) return null;

    const now = Date.now();
    const expirationTime =
      typeof args.subscription.expirationTime === "number"
        ? args.subscription.expirationTime
        : args.subscription.expirationTime === null
          ? null
          : undefined;

    const existing = await ctx.db
      .query("pushSubscriptions")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_userId_and_endpoint", (q: any) =>
        q.eq("userId", userId).eq("endpoint", endpoint),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        p256dh,
        auth,
        expirationTime,
        updatedAt: now,
      });
      return null;
    }

    await ctx.db.insert("pushSubscriptions", {
      userId,
      endpoint,
      p256dh,
      auth,
      expirationTime,
      createdAt: now,
      updatedAt: now,
    });

    return null;
  },
});

export const deleteMyPushSubscription = mutation({
  args: {
    endpoint: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await resolveViewerUserId(ctx);
    const endpoint = typeof args.endpoint === "string" ? args.endpoint.trim() : "";

    const rows = endpoint
      ? await ctx.db
          .query("pushSubscriptions")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .withIndex("by_userId_and_endpoint", (q: any) =>
            q.eq("userId", userId).eq("endpoint", endpoint),
          )
          .collect()
      : await ctx.db
          .query("pushSubscriptions")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .withIndex("by_userId", (q: any) => q.eq("userId", userId))
          .collect();

    for (const row of rows) {
      await ctx.db.delete(row._id);
    }

    return null;
  },
});

