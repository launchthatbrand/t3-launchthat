"use client";

import React from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@convex-config/_generated/api";
import { env } from "~/env";

type PushSubJson = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

const isRootHost = (hostname: string): boolean => {
  const h = hostname.toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === env.NEXT_PUBLIC_ROOT_DOMAIN.toLowerCase();
};

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const asPushSubJson = (sub: PushSubscription): PushSubJson => {
  // PushSubscription is not directly serializable; JSON.stringify handles it via .toJSON().
  const rawUnknown: unknown = JSON.parse(JSON.stringify(sub));
  const raw = rawUnknown as Partial<PushSubJson>;
  const endpoint = typeof raw.endpoint === "string" ? raw.endpoint : "";
  const p256dh = typeof raw.keys?.p256dh === "string" ? raw.keys.p256dh : "";
  const auth = typeof raw.keys?.auth === "string" ? raw.keys.auth : "";
  return { endpoint, expirationTime: raw.expirationTime ?? null, keys: { p256dh, auth } };
};

/**
 * Background initializer for push notifications:
 * - Registers the service worker
 * - Detects existing subscription and keeps Convex in sync
 *
 * It does NOT auto-prompt the user for notification permissions.
 */
export const PushNotificationsClient = () => {
  const { isAuthenticated } = useConvexAuth();
  const enabled = typeof window !== "undefined" && isRootHost(window.location.hostname);

  const subscriptionRowId = useQuery(
    api.pushSubscriptions.queries.getMySubscriptionRowId,
    enabled && isAuthenticated ? {} : "skip",
  ) as string | null | undefined;

  const upsert = useMutation(api.pushSubscriptions.mutations.upsertMyPushSubscription);
  const remove = useMutation(api.pushSubscriptions.mutations.deleteMyPushSubscription);

  const [isSupported, setIsSupported] = React.useState(false);
  const [registrationReady, setRegistrationReady] = React.useState(false);
  const [permission, setPermission] = React.useState<NotificationPermission>("default");
  const [hasBrowserSubscription, setHasBrowserSubscription] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) return;
    const supported = "serviceWorker" in navigator && "PushManager" in window;
    setIsSupported(supported);
    setPermission(Notification.permission);
    if (!supported) return;

    let cancelled = false;
    const run = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        if (cancelled) return;
        setRegistrationReady(true);

        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (cancelled) return;
        setHasBrowserSubscription(Boolean(sub));
      } catch {
        // ignore; UI (if any) will remain disabled
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // Keep Convex in sync when the browser already has a subscription.
  React.useEffect(() => {
    if (!enabled) return;
    if (!isSupported || !registrationReady) return;
    if (!isAuthenticated) return;
    if (permission !== "granted") return;

    let cancelled = false;
    const run = async () => {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return;
      if (cancelled) return;

      const json = asPushSubJson(sub);
      if (!json.endpoint || !json.keys.p256dh || !json.keys.auth) return;

      await upsert({ subscription: json });
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [enabled, isSupported, registrationReady, isAuthenticated, permission, upsert]);

  // If Convex thinks we have a subscription but the browser doesn't, remove server row.
  React.useEffect(() => {
    if (!enabled) return;
    if (!isSupported || !registrationReady) return;
    if (!isAuthenticated) return;
    if (subscriptionRowId === undefined) return;
    if (subscriptionRowId && !hasBrowserSubscription) {
      void remove({});
    }
  }, [
    enabled,
    isSupported,
    registrationReady,
    isAuthenticated,
    subscriptionRowId,
    hasBrowserSubscription,
    remove,
  ]);

  // Expose imperative helpers so admin/account pages can trigger subscribe/unsubscribe
  // without forcing this component to render a UI.
  React.useEffect(() => {
    if (!enabled) return;
    if (!isSupported) return;

    const g = globalThis as unknown as {
      __tlPush?: {
        subscribe: () => Promise<boolean>;
        unsubscribe: () => Promise<boolean>;
      };
    };

    g.__tlPush = {
      subscribe: async () => {
        if (!registrationReady) return false;
        const publicKey = String(env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "").trim();
        if (!publicKey) return false;

        const perm = await Notification.requestPermission();
        setPermission(perm);
        if (perm !== "granted") return false;

        const reg = await navigator.serviceWorker.ready;
        const sub =
          (await reg.pushManager.getSubscription()) ??
          (await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          }));

        setHasBrowserSubscription(Boolean(sub));

        if (isAuthenticated && sub) {
          const json = asPushSubJson(sub);
          if (json.endpoint && json.keys.p256dh && json.keys.auth) {
            await upsert({ subscription: json });
          }
        }
        return Boolean(sub);
      },
      unsubscribe: async () => {
        if (!registrationReady) return false;
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!sub) {
          if (isAuthenticated) await remove({});
          setHasBrowserSubscription(false);
          return true;
        }
        await sub.unsubscribe();
        setHasBrowserSubscription(false);
        if (isAuthenticated) await remove({});
        return true;
      },
    };

    return () => {
      if (g.__tlPush) delete g.__tlPush;
    };
  }, [enabled, isSupported, registrationReady, isAuthenticated, upsert, remove]);

  // No UI here (intentionally).
  return null;
};

