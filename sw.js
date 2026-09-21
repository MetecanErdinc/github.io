/* Service worker — uygulama kabuğunu önbelleğe alır, çevrimdışı açılışı sağlar. */

const CACHE = 'diyet-v3';
const SDK_CACHE = 'firebase-sdk-v1';   // sürüm adreste; içerik hiç değişmez

const SHELL = [
  './',
  './index.html',
  './app.css',
  './app.js',
  './plan.js',
  './store.js',
  './util.js',
  './config.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE && k !== SDK_CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  /* Firebase SDK: sürüm adresin içinde, içeriği değişmez — önce önbellek. */
  if (url.hostname === 'www.gstatic.com') {
    e.respondWith((async () => {
      const c = await caches.open(SDK_CACHE);
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    })());
    return;
  }

  if (url.origin !== self.location.origin) return;

  /*  Uygulama kodu: önce ağ. Güncelleme çıktığında kullanıcının eski sürümde
      takılı kalmaması, çevrimdışı açılabilmesinden daha önemli. */
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
      return res;
    } catch {
      const hit = await caches.match(req);
      if (hit) return hit;
      if (req.mode === 'navigate') return caches.match('./index.html');
      throw new Error('offline');
    }
  })());
});
