"use node";

import { action } from "../_generated/server";
import { components } from "../_generated/api";
import { resolveViewerUserId } from "../traderlaunchpad/lib/resolve";
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
    await resolveViewerUserId(ctx);

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

    const payload = JSON.stringify({
      title: String(args.title ?? "Trader Launchpad"),
      body: String(args.body ?? "Test notification"),
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      url: typeof args.url === "string" && args.url.trim() ? args.url.trim() : "/",
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
