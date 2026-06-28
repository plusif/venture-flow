// Venture Flow - Service Worker
const CACHE_NAME = 'venture-flow-v3';
const ASSETS = [
    'https://plusif.github.io/venture-flow/',
    'https://plusif.github.io/venture-flow/index.html',
    'https://plusif.github.io/venture-flow/manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
            .catch(error => {
                console.error('[SW] Cache failed:', error);
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
            .catch(() => new Response('Offline', { status: 503 }))
    );
});