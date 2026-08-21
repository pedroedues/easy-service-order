// Bump this on any release that changes cached files — the activate handler
// deletes every cache that doesn't match, so stale assets don't stick around.
const CACHE_NAME = 'talao-os-v3';

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

// Vendor libs and icons are heavy, third-party, and effectively immutable —
// safe (and faster) to serve straight from cache.
const CACHE_FIRST_PATTERNS = [/\/js\/vendor\//, /\/icons\//];

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

// The app's own code (HTML/CSS/JS) uses network-first: while online, a
// deploy takes effect on the very next reload instead of silently serving a
// stale cached module (which once meant a reprint button whose cached JS
// still lacked the function it needed to call). The cache here only kicks
// in when there's no network at all.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Only http(s) requests are cacheable — chrome-extension:// and similar
  // schemes (from browser extensions sharing this page) make Cache.put()
  // throw, so leave those to the browser's normal handling.
  if (!event.request.url.startsWith('http')) return;

  const isCacheFirst = CACHE_FIRST_PATTERNS.some((pattern) => pattern.test(event.request.url));
  event.respondWith(isCacheFirst ? cacheFirst(event.request) : networkFirst(event.request));
});

async function networkFirst(request) {
  try {
    // Bypass the browser's own HTTP cache too — a Last-Modified/ETag-based
    // heuristic cache hit would silently reintroduce the same staleness
    // this strategy exists to avoid.
    const response = await fetch(request, { cache: 'reload' });
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw new Error('Sem rede e sem versão em cache para esta requisição.');
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}
