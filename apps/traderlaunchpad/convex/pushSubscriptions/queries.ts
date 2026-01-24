import { v } from "convex/values";
import { components } from "../_generated/api";
import { query } from "../_generated/server";

export const getMySubscriptionRowId = query({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx) => {
    const id = await ctx.runQuery(
      components.launchthat_push.queries.getMySubscriptionRowId,
      {},
    );
    return typeof id === "string" || id === null ? id : null;
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
    const rows = await ctx.runQuery(
      components.launchthat_push.queries.listMySubscriptions,
      {},
    );
    return Array.isArray(rows) ? rows : [];
  },
});

