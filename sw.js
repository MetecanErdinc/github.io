/* Service worker — uygulama kabuğunu önbelleğe alır, çevrimdışı açılışı sağlar. */

const CACHE = 'aliskanliklarim-v2';

const SHELL = [
  './',
  './index.html',
  './app.css',
  './app.js',
  './data.js',
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
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;

  // Yalnızca kendi dosyalarımızı yönetiyoruz.
  // Firebase/Google istekleri doğrudan ağa gider (SDK kendi önbelleğini yönetir).
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Aynı sitedeki diğer uygulamalar bizim önbelleğimize girmesin.
  // (Service worker kapsamı site kökü olduğu için bu ayrım gerekli.)
  if (url.pathname.includes('/muhendislik/') || url.pathname.includes('/habits/')) return;

  // config.js kullanıcı tarafından düzenlenir: her zaman önce ağdan al,
  // böylece Firebase ayarları değişince anında geçerli olur.
  if (url.pathname.endsWith('/config.js')) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Sayfa gezinmeleri: önce ağ, olmazsa önbellek.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  // Diğer dosyalar: önce önbellek, arka planda tazele.
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
