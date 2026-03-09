const CACHE_NAME = 'ldm-pwa-cache-v1';
const STATIC_ASSETS = [
    './LDM-Assistant-Web.html',
    './manifest.json',
    './icon.svg'
];

self.addEventListener('install', (event) => {
    // 立即接管，不等待
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
    // 清除舊版本的快取
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        // 網路優先 (Network First) 策略：
        // 1. 先嘗試從網路下載最新版本
        fetch(event.request)
            .then((networkResponse) => {
                // 如果成功抓到最新版，就把新版存入快取
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            })
            .catch(() => {
                // 2. 如果網路失敗（沒有網路連線），就從快取中讀取
                return caches.match(event.request);
            })
    );
});
