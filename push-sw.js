self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data?.json() || {};
  } catch {
    payload = { body: event.data?.text() || "Open Big Screen Bible to read today’s Scripture." };
  }

  const title = String(payload.title || "Big Screen Bible");
  const body = String(payload.body || "Take a quiet moment in Scripture.");
  const tag = String(payload.tag || "bsb-daily-reminder");
  let url = "/";
  try {
    const candidate = new URL(String(payload.url || "/"), self.location.origin);
    if (candidate.origin === self.location.origin) url = candidate.href;
  } catch {
    // Keep notification navigation on the app origin.
  }

  event.waitUntil(self.registration.showNotification(title, {
    body,
    tag,
    icon: "/assets/icons/icon-192.png?v=20260713-refined",
    badge: "/assets/icons/favicon-32.png?v=20260713-refined",
    data: { url },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || new URL("/", self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if ("navigate" in client) await client.navigate(targetUrl);
      if ("focus" in client) return client.focus();
    }
    return self.clients.openWindow(targetUrl);
  })());
});
