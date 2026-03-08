// 最简 Service Worker：仅满足 PWA 可安装条件，不缓存
self.addEventListener('install', (e) => {
  self.skipWaiting()
})
self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim())
})
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request))
})
