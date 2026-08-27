const CACHE = 'gesture-replay-shell-v2';
const SHELL = ['/', '/privacy/', '/terms/', '/favicon.svg'];
const ASSET_PATH = /^\/assets\/[A-Za-z0-9._-]+$/;

function hasLicenseData(url) {
  const parsed = new URL(url, self.location.origin);
  return [...parsed.searchParams.keys()].some((key) => /license|token/i.test(key));
}

function isSafeStaticRequest(request) {
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || request.method !== 'GET' || url.search || hasLicenseData(url)) return false;
  return SHELL.includes(url.pathname) || ASSET_PATH.test(url.pathname);
}

function isSafeStaticResponse(response) {
  const url = new URL(response.url, self.location.origin);
  return response.ok && response.type === 'basic' && !url.search && !hasLicenseData(url);
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Checkout returns and verification data are always network-only: no URL or
  // response containing license material can enter Cache Storage.
  if (hasLicenseData(url)) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/')));
    return;
  }

  if (!isSafeStaticRequest(event.request)) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (isSafeStaticResponse(response)) {
      void caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
    }
    return response;
  })));
});
