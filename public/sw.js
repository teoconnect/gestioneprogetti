self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple pass-through that falls back to network to ensure a valid response
  // and satisfies the browser's PWA heuristics (needs a fetch handler).
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response("Offline content not available.", {
        status: 503,
        statusText: "Service Unavailable",
        headers: new Headers({
          "Content-Type": "text/plain"
        })
      });
    })
  );
});
