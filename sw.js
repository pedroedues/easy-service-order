// Bump this on any release that changes cached files — the activate handler
// deletes every cache that doesn't match, so stale assets don't stick around.
const CACHE_NAME = 'talao-os-v1';

const APP_SHELL = [
  '.',
  'index.html',
  'manifest.json',
  'css/tokens.css',
  'css/base.css',
  'css/layout.css',
  'css/components.css',
  'css/print.css',
  'js/main.js',
  'js/store.js',
  'js/repository.js',
  'js/whatsapp.js',
  'js/utils/format.js',
  'js/utils/hash.js',
  'js/ui/formCliente.js',
  'js/ui/formItens.js',
  'js/ui/preview.js',
  'js/ui/modalEmpresa.js',
  'js/ui/toast.js',
  'js/ui/historico.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

// Stale-while-revalidate: serve from cache instantly when available, refresh
// the cache in the background. Anything not in APP_SHELL (the PDF libs,
// fonts) gets cached the first time it's actually requested, so PDF
// generation still works offline after the first successful run.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    }),
  );
});
