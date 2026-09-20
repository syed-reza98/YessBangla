/* Minimal offline-capable service worker for YessPOS */
const CACHE = "yesspos-shell-v1";
const PRECACHE = ["/", "/auth", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE).catch(() => undefined))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Network-first for API/actions; cache-first for static assets
  if (url.pathname.startsWith("/api/") || url.pathname.includes("_next")) {
    event.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      void caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }).catch(() => caches.match("/") ))
  );
});
