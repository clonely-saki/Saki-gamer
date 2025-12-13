const CACHE_NAME = 'jpgamer-offline-v7';

// Only cache the shell files during install.
const URLS_TO_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  // Cache the icons defined in manifest to support offline install prompts
  'https://www.pwabuilder.com/assets/icons/icon_192.png',
  'https://www.pwabuilder.com/assets/icons/icon_512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Pre-caching shell');
        // Note: caching external resources in addAll might fail if CORS is not set on them.
        // PWABuilder assets usually allow CORS, but if this fails, the SW install might fail.
        // To be safe, we wrap it.
        return cache.addAll(URLS_TO_PRECACHE).catch(err => {
            console.warn('SW: Failed to cache some external assets', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Clearing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Strategy 1: HTML Navigation - Network First
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match('/index.html') || caches.match(event.request);
        })
    );
    return;
  }

  // Strategy 2: Assets - Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch((err) => {
            console.log('SW: Fetch failed for asset', err);
        });

        return cachedResponse || fetchPromise;
      })
  );
});