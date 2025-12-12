const CACHE_NAME = 'jp-gamer-v3';

// Identify external resources we definitely need for the app to shell to load
// Note: In a pure Vite build, these might be bundled, but keeping them here ensures robustness if using the CDN approach.
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json?v=2',
  // Ensure we try to cache the icon
  'https://placehold.co/192x192/0f1923/ffffff/png?text=JP',
  'https://placehold.co/512x512/0f1923/ffffff/png?text=JP'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Navigation requests: Network first, then cache (to get fresh index.html for updates), or Stale-While-Revalidate
  // For this app, Stale-While-Revalidate is good for speed, but Network First ensures vocab updates are seen.
  // Let's use Cache First for assets/libs, Network First for HTML.
  
  const requestUrl = new URL(event.request.url);

  // Strategy for HTML: Network First (to get updates), fall back to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Strategy for Assets (JS, CSS, Images, Fonts): Cache First, fallback to Network
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((networkResponse) => {
          // Check if we received a valid response
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
            return networkResponse;
          }

          // Cache logic: Cache everything that looks like an asset or external lib
          // This enables offline support for CDN resources (esm.sh, tailwind)
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});