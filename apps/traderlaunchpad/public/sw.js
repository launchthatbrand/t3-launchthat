/* eslint-disable no-restricted-globals */

// Minimal service worker for Web Push.
// Intentionally does NOT implement offline caching.

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = null;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Trader Launchpad", body: event.data.text() };
  }

  const title = payload && payload.title ? String(payload.title) : "Trader Launchpad";
  const body = payload && payload.body ? String(payload.body) : "";
  const icon = payload && payload.icon ? String(payload.icon) : "/icon-192x192.png";
  const badge = payload && payload.badge ? String(payload.badge) : "/icon-192x192.png";
  const url = payload && payload.url ? String(payload.url) : "/";
  const notificationId =
    payload && payload.data && payload.data.notificationId
      ? String(payload.data.notificationId)
      : "";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      data: { url, notificationId },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification && event.notification.data ? event.notification.data : {};
  const url = data && data.url ? String(data.url) : "/";
  const notificationId = data && data.notificationId ? String(data.notificationId) : "";

  event.waitUntil(
    (async () => {
      // Prefer focusing an existing window/tab if possible.
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        if ("focus" in client) {
          client.postMessage({
            kind: "notificationClick",
            url,
            notificationId,
            channel: "push",
            eventType: "clicked",
          });
          return client.focus();
        }
      }

      // If we have to open a new window, include notificationId in the URL so the app
      // can attribute the click after load.
      try {
        const u = new URL(url, self.location.origin);
        if (notificationId) u.searchParams.set("__n", notificationId);
        return self.clients.openWindow(u.toString());
      } catch {
        return self.clients.openWindow(url);
      }
    })(),
  );
});

