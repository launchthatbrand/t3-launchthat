export type PushSubscriptionPayload = {
  endpoint: string;
  expirationTime?: number | null;
  keys: { p256dh: string; auth: string };
};

/**
 * Minimal helper for extracting the serializable subscription payload expected by Convex.
 */
export const toSubscriptionPayload = (
  sub: PushSubscription,
): PushSubscriptionPayload => ({
  endpoint: sub.endpoint,
  expirationTime: sub.expirationTime ?? null,
  keys: {
    p256dh: sub.toJSON().keys?.p256dh ?? "",
    auth: sub.toJSON().keys?.auth ?? "",
  },
});

