// Service worker for the installed dashboard, limited to /admin.html.
// Always prefers the network so updates appear right away. The saved copy only lets
// the app window open when offline. Supabase requests are never touched or stored.
const CACHE = 'miftah-admin-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n !== CACHE).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(e.request, { cache: 'no-cache' });
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    } catch (err) {
      const saved = await caches.match(e.request, { ignoreSearch: true });
      if (saved) return saved;
      throw err;
    }
  })());
});
