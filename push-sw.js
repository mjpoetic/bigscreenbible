self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

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

// Installed PWAs receive text without placing a devotional in browser history.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'POST' || url.origin !== self.location.origin || url.pathname !== '/' || url.searchParams.get('import') !== 'share') return;
  event.respondWith((async () => {
    try {
      const form = await event.request.formData();
      const text = [form.get('title'), form.get('text'), form.get('url')].filter(value => typeof value === 'string' && value.trim()).join('\n\n');
      if (!text || text.length > 100000) return new Response('Please copy the devotional text and use Import from text (up to 100,000 characters).', { status: 400 });
      const cache = await caches.open('bsb-share-inbox');
      // Keep the inbox bounded, including abandoned share operations.
      const keys = await cache.keys();
      for (const key of keys.slice(0, Math.max(0, keys.length - 9))) await cache.delete(key);
      const id = crypto.randomUUID();
      await cache.put(new Request(`${url.origin}/__shared_passages/${id}`), new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }));
      return Response.redirect(`${url.origin}/?import-shared=${id}`, 303);
    } catch { return new Response('Could not receive shared text. Please use Import from text.', { status: 400 }); }
  })());
});
