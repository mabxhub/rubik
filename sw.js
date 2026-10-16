const CACHE = 'rubik-ff79d7ae5c30e0fc';
const ASSETS = ['./','index.html','style.css','vendor/three.min.js','engine.js','app.js','solver-worker.js','pwa.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(path => new Request(path, {cache:'reload'})))));
});
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('rubik-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Only cache the app shell; unrelated same-origin apps keep their own behavior.
  const scope = new URL('./', self.location.href);
  const relative = url.pathname.slice(scope.pathname.length);
  if (!url.pathname.startsWith(scope.pathname) || !ASSETS.includes(relative || './')) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const key = new URL(relative || './', scope);
    return (await cache.match(key)) || fetch(event.request);
  }));
});
