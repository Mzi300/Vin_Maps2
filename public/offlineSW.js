const CACHE_NAME = 'vinmaps-offline-v1';
const MAP_CACHE_NAME = 'vinmaps-tiles-v1';

// Assets to eagerly cache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  // Assuming the build hashes these, we want to cache the base HTML.
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== MAP_CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Mapbox Vector Tiles, Raster Tiles, and API Requests
  if (
    url.hostname.includes('mapbox.com') ||
    url.hostname.includes('cartocdn.com')
  ) {
    event.respondWith(
      caches.open(MAP_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            // Return cached tile/API response
            return response;
          }
          // Fetch from network and cache
          return fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }).catch(() => {
            // If offline and no cache, return a generic error response for APIs
            return new Response('Offline mode active - resource unavailable', {
              status: 503,
              statusText: 'Service Unavailable',
            });
          });
        });
      })
    );
    return;
  }

  // General App Assets Cache First, then Network
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        // Fallback for offline if page reloads
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
