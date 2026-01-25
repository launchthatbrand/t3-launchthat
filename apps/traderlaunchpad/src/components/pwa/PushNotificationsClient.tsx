/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";

import React from "react";
import { api } from "@convex-config/_generated/api";
import { env } from "~/env";

interface PushSubJson {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

const normalizeHost = (hostname: string): string =>
  hostname.trim().toLowerCase().replace(/^www\./, "");

const isRootHost = (hostname: string): boolean => {
  const h = normalizeHost(hostname);
  const root = normalizeHost(String(env.NEXT_PUBLIC_ROOT_DOMAIN ?? ""));
  return h === "localhost" || h === "127.0.0.1" || (root !== "" && h === root);
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

  const hasNotificationApi =
    typeof Notification !== "undefined" &&
    typeof Notification.requestPermission === "function";

  const subscriptionRowId = useQuery(
    api.pushSubscriptions.queries.getMySubscriptionRowId,
    enabled && isAuthenticated ? {} : "skip",
  ) as string | null | undefined;

  const upsert = useMutation(api.pushSubscriptions.mutations.upsertMyPushSubscription);
  const remove = useMutation(api.pushSubscriptions.mutations.deleteMyPushSubscription);
  const trackMyNotificationEvent = useMutation(api.notifications.mutations.trackMyNotificationEvent);

  const [isSupported, setIsSupported] = React.useState(false);
  const [registrationReady, setRegistrationReady] = React.useState(false);
  const [permission, setPermission] = React.useState<NotificationPermission>("default");
  const [hasBrowserSubscription, setHasBrowserSubscription] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) return;
    const supported = "serviceWorker" in navigator && "PushManager" in window;
    setIsSupported(supported);
    setPermission(hasNotificationApi ? Notification.permission : "default");
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
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

        if (!hasNotificationApi) return false;

        const perm = await Notification.requestPermission();
        setPermission(perm);
        if (perm !== "granted") return false;

        const reg = await navigator.serviceWorker.ready;
        const sub =
          (await reg.pushManager.getSubscription()) ??
          (await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as string | BufferSource | null | undefined,
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
  }, [enabled, isSupported, registrationReady, isAuthenticated, hasNotificationApi, upsert, remove]);

  // Track push notification clicks.
  // We support:
  // - service worker message (when a client tab is already open)
  // - `__n=<notificationId>` query param (when SW had to open a new window)
  React.useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const track = async (notificationId: string, targetUrl?: string) => {
      const id = String(notificationId ?? "").trim();
      if (!id) return;
      if (!isAuthenticated) return;
      await trackMyNotificationEvent({
        notificationId: id,
        channel: "push",
        eventType: "clicked",
        targetUrl,
      });
    };

    // URL param attribution
    try {
      const url = new URL(window.location.href);
      const n = url.searchParams.get("__n");
      if (n) {
        void track(n, url.pathname + url.search);
        url.searchParams.delete("__n");
        window.history.replaceState({}, "", url.toString());
      }
    } catch {
      // ignore
    }

    const onMessage = (event: MessageEvent) => {
      const dataUnknown: unknown = event.data;
      const data =
        dataUnknown && typeof dataUnknown === "object"
          ? (dataUnknown as { kind?: unknown; notificationId?: unknown; url?: unknown })
          : null;
      if (!data || data.kind !== "notificationClick") return;
      const notificationId = typeof data.notificationId === "string" ? data.notificationId : "";
      const url = typeof data.url === "string" ? data.url : undefined;
      void track(notificationId, url);
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, [enabled, isAuthenticated, trackMyNotificationEvent]);

  // No UI here (intentionally).
  return null;
};

