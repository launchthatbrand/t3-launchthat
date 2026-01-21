import type { FunctionReference } from "convex/server";
import { v } from "convex/values";

import { components } from "../_generated/api";
import { mutation } from "../_generated/server";

interface NotificationsMutations {
  markNotificationAsRead: FunctionReference<
    "mutation",
    "public",
    { notificationId: string },
    unknown
  >;
  markAllNotificationsAsReadByClerkId: FunctionReference<
    "mutation",
    "public",
    { clerkId: string },
    unknown
  >;
}

const notificationsMutations = (() => {
  const componentsAny = components as unknown as {
    launchthat_notifications?: { mutations?: unknown };
  };
  return (componentsAny.launchthat_notifications?.mutations ??
    {}) as NotificationsMutations;
})();

export const markNotificationAsRead = mutation({
  args: { notificationId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const ok = await ctx.runMutation(notificationsMutations.markNotificationAsRead, {
      notificationId: args.notificationId,
    });
    return Boolean(ok);
  },
});

export const markAllNotificationsAsReadByClerkId = mutation({
  args: { clerkId: v.string() },
  returns: v.number(),
  handler: async (ctx, args) => {
    const count = await ctx.runMutation(
      notificationsMutations.markAllNotificationsAsReadByClerkId,
      { clerkId: args.clerkId },
    );
    return typeof count === "number" ? count : 0;
  },
});

