// Service worker : l'app fonctionne hors ligne après la première visite.
// Pages : réseau d'abord (pour recevoir les mises à jour), cache en secours.
// Fichiers statiques (JS, CSS, images) : cache d'abord.
const CACHE = "bgh-v4";
const CORE = ["/", "/index.html", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/favicon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    const path = new URL(request.url).pathname;
    const isApp = path === "/" || path === "/index.html";
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(isApp ? "/index.html" : request, copy));
          }
          return response;
        })
        .catch(() => caches.match(isApp ? "/index.html" : request).then((hit) => hit || caches.match("/index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
    )
  );
});
