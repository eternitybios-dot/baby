/* すくすくログ Service Worker — iOS PWA 通知用 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
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
