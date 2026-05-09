// Service worker for Max's Games.
// All paths are relative to the SW location, so this works at any subpath
// (root, /maxs-games/, deeper) without changes.
//
// To force clients to refetch after a deploy: bump CACHE_VERSION below.

const CACHE_VERSION = 'v8';
const CACHE_NAME = `maxs-games-${CACHE_VERSION}`;

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './hub/hub.css',
  './hub/hub.js',
  './hub/games.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './games/ball-sort/',
  './games/ball-sort/index.html',
  './games/ball-sort/ball-sort.css',
  './games/ball-sort/ball-sort.js',
  './games/ball-sort/audio.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // addAll is atomic: any 404 fails the whole install. We use Promise.all
      // with put() instead so a missing optional asset doesn't kill install.
      Promise.all(
        PRECACHE.map((url) =>
          fetch(url, { cache: 'reload' })
            .then((res) => (res.ok ? cache.put(url, res) : null))
            .catch(() => null)
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('maxs-games-') && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch cross-origin

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          // Offline + uncached: for navigations, fall back to the hub.
          if (req.mode === 'navigate') return caches.match('./index.html');
          return new Response('', { status: 504 });
        });
    })
  );
});
