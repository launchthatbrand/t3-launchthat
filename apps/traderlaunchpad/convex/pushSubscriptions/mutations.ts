import { v } from "convex/values";
import { components } from "../_generated/api";
import { mutation } from "../_generated/server";

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
    await ctx.runMutation(components.launchthat_push.mutations.upsertMyPushSubscription, {
      subscription: args.subscription,
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
    await ctx.runMutation(components.launchthat_push.mutations.deleteMyPushSubscription, {
      endpoint: args.endpoint,
    });
    return null;
  },
});

