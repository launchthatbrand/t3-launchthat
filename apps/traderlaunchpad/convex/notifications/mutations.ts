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
  markAllNotificationsAsReadByUserId: FunctionReference<
    "mutation",
    "public",
    { userId: string },
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

type UnknownRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is UnknownRecord =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const resolveUserIdByClerkId = async (ctx: any, clerkId: string): Promise<string | null> => {
  const user = (await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
    .first()) as unknown;
  if (!isRecord(user)) return null;
  const id = user._id;
  return typeof id === "string" ? id : null;
};

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
    const userId = await resolveUserIdByClerkId(ctx, args.clerkId);
    if (!userId) return 0;
    const count = await ctx.runMutation(
      notificationsMutations.markAllNotificationsAsReadByUserId,
      { userId },
    );
    return typeof count === "number" ? count : 0;
  },
});

