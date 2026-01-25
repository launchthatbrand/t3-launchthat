/* eslint-disable no-restricted-globals */

// Minimal service worker for Web Push.
// Intentionally does NOT implement offline caching.

const DEBUG =
  self.location &&
  typeof self.location.hostname === "string" &&
  (self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1");

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

  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log("[sw] push received", { title, url, notificationId, payload });
  }

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

  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log("[sw] notificationclick", { url, notificationId, data });
  }

  event.waitUntil(
    (async () => {
      // Always try to attach notificationId to the navigation target for attribution.
      let urlWithId = url;
      try {
        const u = new URL(url, self.location.origin);
        if (notificationId) u.searchParams.set("__n", notificationId);
        urlWithId = u.toString();
      } catch {
        // keep raw url
      }

      // Prefer focusing an existing window/tab if possible.
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        if (DEBUG) {
          // eslint-disable-next-line no-console
          console.log("[sw] found client", { url: client.url });
        }

        if ("focus" in client) {
          if (DEBUG) {
            // eslint-disable-next-line no-console
            console.log("[sw] posting message to existing client", { url, notificationId });
          }
          client.postMessage({
            kind: "notificationClick",
            url,
            notificationId,
            channel: "push",
            eventType: "clicked",
          });

          // Best-effort: navigate the existing tab so `__n` can be picked up reliably.
          // WindowClient.navigate exists in modern browsers.
          try {
            const win = client;
            if (notificationId && "navigate" in win && typeof win.navigate === "function") {
              await win.focus();
              if (DEBUG) {
                // eslint-disable-next-line no-console
                console.log("[sw] navigating existing client", { to: urlWithId });
              }
              return win.navigate(urlWithId);
            }
          } catch {
            // ignore; fallback to focus only
          }

          return client.focus();
        }
      }

      // If we have to open a new window, include notificationId in the URL so the app
      // can attribute the click after load.
      try {
        if (DEBUG) {
          // eslint-disable-next-line no-console
          console.log("[sw] opening new window", { to: urlWithId });
        }
        return self.clients.openWindow(urlWithId);
      } catch {
        if (DEBUG) {
          // eslint-disable-next-line no-console
          console.log("[sw] opening new window (raw url)", { to: url });
        }
        return self.clients.openWindow(url);
      }
    })(),
  );
});

