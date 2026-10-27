const CACHE_NAME = 'encuestas-v1';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/chart.js',
  './js/dexie.js',
  './js/scripts.js',
  './manifest.json',
  './img/logo.png'
];

// Instalar el Service Worker y almacenar los archivos locales en la caché del navegador
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Archivos cacheados con éxito para modo Offline.');
      return cache.addAll(ASSETS);
    })
  );
});

// Activar el Service Worker y limpiar cachés antiguas si las hubiera
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
});

// Responder desde el caché cuando no haya conexión a internet
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});
