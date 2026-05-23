// Service Worker para funcionamiento offline (estrategia network-first para activos críticos)
const CACHE_NAME = 'usicamm-v16';
const ARCHIVOS = [
  './',
  'index.html',
  'app.js',
  'styles.css',
  'preguntas.json',
  'glosario.json',
  'resumenes.json',
  'manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ARCHIVOS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(claves =>
      Promise.all(claves.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first para HTML/CSS/JS y JSON; cache-first para fonts e imágenes.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const esCritico = /\.(html|js|css|json)$/.test(url.pathname) || url.pathname === '/' || url.pathname.endsWith('/');

  if (esCritico) {
    // Network-first: trae desde la red, si falla usa cache
    e.respondWith(
      fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          const clon = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clon));
        }
        return resp;
      }).catch(() => caches.match(e.request).then(c => c || caches.match('index.html')))
    );
  } else {
    // Cache-first
    e.respondWith(
      caches.match(e.request).then(c => c || fetch(e.request).then(resp => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const clon = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clon));
        }
        return resp;
      }))
    );
  }
});
