// sw.js — CIVITAS Field Worker Service Worker
// Caches static assets and enables offline fallback

const CACHE_NAME = 'civitas-worker-v1';
const STATIC_ASSETS = [
    '/worker.html',
    '/auth.js',
    '/style2.css',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(STATIC_ASSETS).catch(() => { }); // non-fatal
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    // Only cache GET requests for our own origin
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (!url.origin.startsWith('chrome-extension') && url.origin === self.location.origin) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                return cached || fetch(event.request).then(response => {
                    // Cache HTML / CSS / JS on the fly
                    if (response.ok && ['text/html', 'text/css', 'application/javascript'].some(t => response.headers.get('content-type')?.includes(t))) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
                    }
                    return response;
                }).catch(() => cached || new Response('Offline - content not cached', { status: 503 }));
            })
        );
    }
});
