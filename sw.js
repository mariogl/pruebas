const nombreCache = 'cursos-precache-v3';
const precacheUrls = [
  '/',
  '/index.html',
  'https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css',
  'https://code.jquery.com/jquery-3.2.1.slim.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js',
  'https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://hammerjs.github.io/dist/hammer.min.js',
  'manifest.json',
  'css/estilos.css',
  'js/scripts.js',
  'icons/favicon-32x32.png'
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(nombreCache).then(cache => {
      return cache.addAll(precacheUrls);
    })
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(cachesKeys => {
      return Promise.all(
        cachesKeys.filter(cacheKey => cacheKey !== nombreCache).map(cacheKey => caches.delete(cacheKey))
      );
    })
  );
})

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.open(nombreCache).then(cache => {
      return cache.match(e.request).then(resp => {
        if (resp) {
          return resp;
        } else {
          return fetch(e.request).then(resp => {
            caches.open(nombreCache).then(cache => cache.put(e.request, resp).catch(err => console.log(1, err)));  // probar put
            return resp.clone();
          }).catch(err => console.log(2, err))
        }
      })
    })
  )
});
