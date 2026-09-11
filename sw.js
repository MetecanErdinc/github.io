/* Service worker — uygulama kabuğunu önbelleğe alır, çevrimdışı açılışı sağlar. */

const CACHE = 'aliskanliklarim-v18';
const SDK_CACHE = 'firebase-sdk-v1';   // sürüm adreste; içerik hiç değişmez

const SHELL = [
  './',
  './index.html',
  './app.css',
  './app.js',
  './data.js',
  './util.js',
  './program.js',
  './plan.js',
  './foods.js',
  './tr-foods.js',
  './photo.js',
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
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE && k !== SDK_CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;

  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  /*  Firebase kütüphanesi gstatic'ten geliyor. Önbelleğe alınmazsa uygulama
      çevrimdışı açıldığında giriş ekranını bile çizemiyor. Sürüm numarası
      adresin içinde olduğu için bu dosyalar hiç değişmez; önce önbellek. */
  if (url.hostname === 'www.gstatic.com' && url.pathname.includes('/firebasejs/')) {
    e.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(SDK_CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }))
    );
    return;
  }

  // Diğer tüm dış istekler (Firestore trafiği dahil) doğrudan ağa gider.
  if (url.origin !== self.location.origin) return;

  // Aynı sitedeki diğer uygulamalar bizim önbelleğimize girmesin.
  // (Service worker kapsamı site kökü olduğu için bu ayrım gerekli.)
  if (url.pathname.includes('/muhendislik/') || url.pathname.includes('/habits/')) return;

  /*  Uygulamanın kendi kodu (HTML/JS/CSS/JSON): ÖNCE AĞ.
      Sebebi: "önce önbellek" kullanınca yeni bir sürüm yayınlandığında sayfa
      taze HTML ile eski JavaScript'i birlikte yüklüyor ve yeni özellikler bir
      sonraki açılışa kadar görünmüyordu. Dosyalar küçük; tazelik gecikmeye
      değer. Ağ yoksa önbellekten servis edilir, çevrimdışı çalışma bozulmaz. */
  const isAppCode = req.mode === 'navigate' ||
                    /\.(?:js|css|json|webmanifest)$/.test(url.pathname);

  if (isAppCode) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE)
              .then((c) => c.put(req.mode === 'navigate' ? './index.html' : req, copy))
              .catch(() => {});
          }
          return res;
        })
        .catch(() => (req.mode === 'navigate'
          ? caches.match('./index.html').then((r) => r || caches.match('./'))
          : caches.match(req)))
    );
    return;
  }

  /*  Görseller ve diğer değişmeyen dosyalar: önce önbellek, arka planda tazele. */
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