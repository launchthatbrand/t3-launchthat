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

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification && event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : "/";

  event.waitUntil(
    (async () => {
      // Prefer focusing an existing window/tab if possible.
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        if ("focus" in client) {
          client.postMessage({ kind: "notificationClick", url });
          return client.focus();
        }
      }

      return self.clients.openWindow(url);
    })(),
  );
});

