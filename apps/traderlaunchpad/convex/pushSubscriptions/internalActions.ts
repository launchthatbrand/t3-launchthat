"use node";

import { v } from "convex/values";
import webpush from "web-push";

import { components } from "../_generated/api";
import { internalAction } from "../_generated/server";

const payloadValidator = v.object({
  title: v.string(),
  body: v.optional(v.string()),
  url: v.optional(v.string()),
  icon: v.optional(v.string()),
  badge: v.optional(v.string()),
  data: v.optional(v.record(v.string(), v.string())),
});

type PushSub = {
  endpoint: string;
  p256dh: string;
  auth: string;
  expirationTime?: number | null;
};

const configureWebpush = () => {
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
};

export const sendPushToUser = internalAction({
  args: {
    userId: v.string(),
    payload: payloadValidator,
  },
  returns: v.object({
    ok: v.boolean(),
    sent: v.number(),
    failed: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    configureWebpush();

    const userId = args.userId.trim();
    if (!userId) return { ok: true, sent: 0, failed: 0, errors: [] };

    const subs: PushSub[] = await ctx.runQuery(
      components.launchthat_push.queries.listSubscriptionsByUserId,
      { userId },
    );

    const payloadJson = JSON.stringify({
      title: args.payload.title,
      body: args.payload.body,
      url: args.payload.url,
      icon: args.payload.icon,
      badge: args.payload.badge,
      data: args.payload.data,
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
        await webpush.sendNotification(pushSub, payloadJson);
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

