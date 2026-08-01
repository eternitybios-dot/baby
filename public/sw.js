/* すくすくログ Service Worker — iOS PWA 通知 + キャッシュ更新 */
const SW_VERSION = "2026-08-01-form-spacing";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key))),
    ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SW_VERSION)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim())
      .then(() =>
        self.clients.matchAll({ type: "window", includeUncontrolled: true }),
      )
      .then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: "SW_UPDATED", version: SW_VERSION });
        }
      }),
  );
});

// HTML は常にネット優先（古いホームが残らないようにする）
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const accept = request.headers.get("accept") || "";
  const isNavigate =
    request.mode === "navigate" || accept.includes("text/html");

  if (!isNavigate) return;

  event.respondWith(
    fetch(request, { cache: "no-store" }).catch(() => caches.match(request)),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "SHOW_NOTIFICATION") return;

  const title = data.title || "すくすくログ";
  const options = {
    body: data.body || "",
    tag: data.tag || "sukusuku",
    data: { url: data.url || "./home/" },
    lang: "ja",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "すくすくログ",
    body: "新しい記録があります",
    url: "./home/",
    tag: "sukusuku-push",
  };
  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() };
    }
  } catch {
    try {
      const text = event.data ? event.data.text() : "";
      if (text) payload.body = text;
    } catch {
      /* ignore */
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "すくすくログ", {
      body: payload.body || "",
      tag: payload.tag || "sukusuku-push",
      data: { url: payload.url || "./home/" },
      lang: "ja",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url =
    (event.notification.data && event.notification.data.url) || "./home/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            if ("navigate" in client && url) {
              try {
                client.navigate(url);
              } catch {
                /* ignore */
              }
            }
            return;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      }),
  );
});
