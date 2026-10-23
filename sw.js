/* Service worker portal Bright Vista: tải trước vỏ trang, dữ liệu JSON lấy mạng trước rồi mới tới bộ nhớ đệm. */
const CACHE = 'bv-portal-v1';
const SHELL = ['portal.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'data/schedule.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.hostname.endsWith('script.google.com') || u.hostname.endsWith('googleusercontent.com')) return;   // API lịch thật: không lưu đệm ở đây
  const sameOrigin = u.origin === self.location.origin;
  if (sameOrigin && (u.pathname.endsWith('.json') || e.request.mode === 'navigate')) {
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('portal.html'))));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
    if (res.ok || res.type === 'opaque') { const c = res.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); }
    return res;
  })));
});
