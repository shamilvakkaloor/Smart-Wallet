const CACHE_NAME = "smart-wallet-offline-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith("smart-wallet-offline-") && key !== CACHE_NAME).map((key) => caches.delete(key))
  )).then(() => self.clients.claim()));
});

// Never cache account pages, API responses, receipts or submitted transactions.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || event.request.mode !== "navigate" ||
      url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  event.respondWith(fetch(event.request).catch(async () =>
    await caches.match(OFFLINE_URL) || new Response("You are offline. Reconnect to open Smart Wallet.", {
      status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  ));
});
