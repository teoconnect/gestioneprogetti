self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // A simple pass-through to satisfy the PWA requirements.
  // In a full offline PWA, you would handle caching here.
  event.respondWith(fetch(event.request));
});
