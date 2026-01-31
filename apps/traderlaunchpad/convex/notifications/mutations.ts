import type { FunctionReference } from "convex/server";
import { v } from "convex/values";

import { components, internal } from "../_generated/api";
import { mutation } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import { resolveUserIdByClerkId, resolveViewerUserId } from "../traderlaunchpad/lib/resolve";

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

  trackNotificationEvent: FunctionReference<
    "mutation",
    "public",
    {
      notificationId: string;
      userId: string;
      channel: string;
      eventType: string;
      targetUrl?: string;
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

export const markNotificationAsRead = mutation({
  args: { notificationId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const ok = await ctx.runMutation(notificationsMutations.markNotificationAsRead, {
      notificationId: args.notificationId,
    });

    // Track in-app opens/clicks by recording an event when the user opens a notification.
    // This is intentionally tied to "mark as read" since that's the most reliable signal
    // we have from the UI today (and avoids needing UI changes across apps).
    if (ok) {
      try {
        const userId = await resolveViewerUserId(ctx);
        if (userId) {
          await ctx.runMutation(notificationsMutations.trackNotificationEvent, {
            notificationId: args.notificationId,
            userId,
            channel: "inApp",
            eventType: "opened",
          });
        }
      } catch {
        // ignore analytics failures
      }
    }
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

export const markAllNotificationsAsReadForViewer = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const userId = await resolveViewerUserId(ctx);
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
    notificationId: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const userId = await resolveUserIdByClerkId(ctx, args.clerkId);
    if (!userId) return { notificationCreated: false, pushAttempted: false };

    const notificationIdUnknown = await ctx.runMutation(notificationsMutations.createNotification, {
      userId,
      orgId: args.orgId,
      eventKey: args.eventKey,
      tabKey: args.tabKey,
      title: args.title,
      content: args.content,
      actionUrl: args.actionUrl,
    });
    const notificationId = typeof notificationIdUnknown === "string" ? notificationIdUnknown : undefined;

    const pushAttempted = args.sendPush === true;
    if (pushAttempted) {
      await ctx.scheduler.runAfter(
        0,
        internal.pushSubscriptions.internalActions.sendPushToUser,
        {
          userId: args.clerkId,
          payload: {
            title: args.title,
            body: args.content,
            url: args.actionUrl,
            icon: "/icon-192x192.png",
            badge: "/icon-192x192.png",
            data: notificationId ? { notificationId } : undefined,
          },
        },
      );
    }

    return { notificationCreated: true, pushAttempted, notificationId };
  },
});

/**
 * Track an interaction for the current viewer against a notification id.
 * This is used for push-notification clickthrough tracking.
 */
export const trackMyNotificationEvent = mutation({
  args: {
    notificationId: v.string(),
    channel: v.optional(v.string()),
    eventType: v.optional(v.string()),
    targetUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const debug = process.env.NODE_ENV !== "production";
    const userId = await resolveViewerUserId(ctx);
    if (!userId) {
      if (debug) {
        console.log("[trackMyNotificationEvent] no userId (unauth)", {
          notificationId: args.notificationId,
        });
      }
      return null;
    }

    if (debug) {
      console.log("[trackMyNotificationEvent] tracking", {
        userId,
        notificationId: args.notificationId,
        channel: args.channel,
        eventType: args.eventType,
        targetUrl: args.targetUrl,
      });
    }

    await ctx.runMutation(notificationsMutations.trackNotificationEvent, {
      notificationId: args.notificationId,
      userId,
      channel: (args.channel ?? "push").trim() || "push",
      eventType: (args.eventType ?? "clicked").trim() || "clicked",
      targetUrl: args.targetUrl,
    });

    if (debug) {
      console.log("[trackMyNotificationEvent] ok", { notificationId: args.notificationId });
    }
    return null;
  },
});

