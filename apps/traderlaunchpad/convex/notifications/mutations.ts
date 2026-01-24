import type { FunctionReference } from "convex/server";
import { v } from "convex/values";

import { components } from "../_generated/api";
import { mutation, type MutationCtx } from "../_generated/server";

/* eslint-disable
  @typescript-eslint/no-require-imports,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access
*/
// Convex codegen may lag newly added internal actions; keep this untyped to avoid blocking dev.
const internalAny: any = require("../_generated/api").internal;
/* eslint-enable
  @typescript-eslint/no-require-imports,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access
*/

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
  createNotification: FunctionReference<
    "mutation",
    "public",
    {
      userId: string;
      orgId: string;
      eventKey: string;
      tabKey?: string;
      title: string;
      content?: string;
      actionUrl?: string;
    },
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

const resolveUserIdByClerkId = async (
  ctx: MutationCtx,
  clerkId: string,
): Promise<string | null> => {
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
    .first();

  return user ? String(user._id) : null;
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

/**
 * Create an in-app notification for a user (identified by Clerk user id) and optionally
 * send a Web Push notification to that same Clerk user id.
 *
 * Notes:
 * - Notifications component is keyed by the app's internal `users` document id.
 * - Push subscriptions are keyed by Clerk user id (JWT subject).
 */
export const createNotificationAndMaybePushByClerkId = mutation({
  args: {
    clerkId: v.string(),
    orgId: v.string(),
    eventKey: v.string(),
    tabKey: v.optional(v.string()),
    title: v.string(),
    content: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
    sendPush: v.optional(v.boolean()),
  },
  returns: v.object({
    notificationCreated: v.boolean(),
    pushAttempted: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const userId = await resolveUserIdByClerkId(ctx, args.clerkId);
    if (!userId) return { notificationCreated: false, pushAttempted: false };

    await ctx.runMutation(notificationsMutations.createNotification, {
      userId,
      orgId: args.orgId,
      eventKey: args.eventKey,
      tabKey: args.tabKey,
      title: args.title,
      content: args.content,
      actionUrl: args.actionUrl,
    });

    const pushAttempted = args.sendPush === true;
    if (pushAttempted) {
      await ctx.scheduler.runAfter(
        0,
        internalAny.pushSubscriptions.internalActions.sendPushToUser,
        {
          userId: args.clerkId,
          payload: {
            title: args.title,
            body: args.content,
            url: args.actionUrl,
            icon: "/icon-192x192.png",
            badge: "/icon-192x192.png",
          },
        },
      );
    }

    return { notificationCreated: true, pushAttempted };
  },
});

