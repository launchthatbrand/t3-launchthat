"use node";

import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { components } from "../_generated/api";
import { resolveOrganizationId } from "../traderlaunchpad/lib/resolve";
import { v } from "convex/values";
import webpush from "web-push";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-require-imports,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access
*/

interface PushSub {
  endpoint: string;
  p256dh: string;
  auth: string;
  expirationTime?: number | null;
}

export const sendTestPushToMe = action({
  args: {
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    url: v.optional(v.string()),
  },
  returns: v.object({
    ok: v.boolean(),
    sent: v.number(),
    failed: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: not signed in.");
    }

    // This is the identifier used by the push component to key subscriptions:
    // subject (Clerk) OR tokenIdentifier (tenant-session Convex auth).
    const pushUserId =
      (typeof identity.subject === "string" && identity.subject.trim()
        ? identity.subject.trim()
        : "") ||
      (typeof identity.tokenIdentifier === "string" && identity.tokenIdentifier.trim()
        ? identity.tokenIdentifier.trim()
        : "");

    if (!pushUserId) {
      throw new Error("Unauthorized: missing viewer identity (subject/tokenIdentifier).");
    }

    const orgId = resolveOrganizationId();

    // Create an in-app notification so we have a canonical notificationId to attribute opens/clicks.
    // This is required to populate notifications.notificationEvents.
    const viewer = await ctx.runQuery(api.viewer.queries.getViewerProfile, {});
    const viewerUserId =
      viewer && typeof viewer === "object" && "userId" in viewer
        ? (viewer as { userId?: unknown }).userId
        : null;
    const viewerUserIdStr = typeof viewerUserId === "string" ? viewerUserId : "";
    if (!viewerUserIdStr) {
      throw new Error("Unauthorized: could not resolve viewer userId.");
    }

    const notificationId = await ctx.runMutation(
      components.launchthat_notifications.mutations.createNotification,
      {
        userId: viewerUserIdStr,
        orgId,
        eventKey: "traderlaunchpad.system.testPush",
        tabKey: "system",
        title: String(args.title ?? "Trader Launchpad"),
        content: String(args.body ?? "Test notification"),
        actionUrl:
          typeof args.url === "string" && args.url.trim() ? args.url.trim() : "/",
      },
    );

    const vapidPublicKey = String(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "").trim();
    const vapidPrivateKey = String(process.env.VAPID_PRIVATE_KEY ?? "").trim();
    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error(
        "Missing VAPID keys in Convex env (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).",
      );
    }

    webpush.setVapidDetails(
      String(process.env.VAPID_SUBJECT ?? "mailto:support@traderlaunchpad.com").trim(),
      vapidPublicKey,
      vapidPrivateKey,
    );

    const subs: PushSub[] = await ctx.runQuery(
      components.launchthat_push.queries.listMySubscriptions,
      {},
    );

    const debug = process.env.NODE_ENV !== "production";
    if (debug) {
      console.log("[sendTestPushToMe] pushUserId=", pushUserId);
      console.log("[sendTestPushToMe] notificationId=", String(notificationId));
      console.log("[sendTestPushToMe] subs=", Array.isArray(subs) ? subs.length : 0);
    }

    const payload = JSON.stringify({
      title: String(args.title ?? "Trader Launchpad"),
      body: String(args.body ?? "Test notification"),
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      url: typeof args.url === "string" && args.url.trim() ? args.url.trim() : "/",
      data: { notificationId: String(notificationId) },
    });

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const sub of Array.isArray(subs) ? subs : []) {
      const endpoint = typeof sub.endpoint === "string" ? sub.endpoint : "";
      const p256dh = typeof sub.p256dh === "string" ? sub.p256dh : "";
      const auth = typeof sub.auth === "string" ? sub.auth : "";
      if (!endpoint || !p256dh || !auth) continue;

      try {
        const pushSub: webpush.PushSubscription = {
          endpoint,
          expirationTime:
            typeof sub.expirationTime === "number"
              ? sub.expirationTime
              : sub.expirationTime === null
                ? null
                : undefined,
          keys: { p256dh, auth },
        };
        await webpush.sendNotification(pushSub, payload);
        sent += 1;
      } catch (err: any) {
        failed += 1;
        const msg: string =
          typeof err?.message === "string"
            ? String(err.message)
            : typeof err === "string"
              ? String(err)
              : "Push send failed";
        errors.push(msg);
      }
    }

    return { ok: true, sent, failed, errors };
  },
});
