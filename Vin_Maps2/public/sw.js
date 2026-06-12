// Service Worker for Mapbox tile caching
const CACHE_NAME = 'vinmaps-core-cache-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/src/main.ts', // placeholder for compiled entry (adjust if needed)
  '/style/index.css'
];

self.addEventListener('install', event => {
  // Pre‑cache core application shell for instant load
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME && k !== 'vinmaps-mbox-cache')
        .map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  // Cache‑first for any Mapbox resource (tiles, styles, sprites, fonts)
  if (url.origin.includes('api.mapbox.com')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) {
          // Refresh cache in background
          fetch(event.request).then(network => {
            const clone = network.clone();
            caches.open('vinmaps-mbox-cache').then(cache => cache.put(event.request, clone));
          }).catch(() => {});
          return cached;
        }
        // Not cached, fetch from network and store
        return fetch(event.request).then(network => {
          const clone = network.clone();
          caches.open('vinmaps-mbox-cache').then(cache => cache.put(event.request, clone));
          return network;
        });
      })
    );
    return;
  }

  // Default cache‑first for other assets
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
