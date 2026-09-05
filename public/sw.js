/* 紫微鉴 Service Worker：离线排盘能力（PRD：数据仅在本机处理）
 *
 * 策略：
 * - 页面导航：网络优先，失败时回退缓存的首页（离线可打开）。
 * - 同源静态资源（js/css/图片/字体）：缓存优先、未命中回填网络。
 *   首次完整在线访问后，页面与排盘引擎 chunk 会按需进入缓存，之后即可离线排盘；
 *   每次发布因资源带内容哈希，新版本自然重新拉取，无需手工清理。
 * - 跨域请求不代理。
 */
const CACHE = 'zwdz-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(['/', '/favicon.svg', '/og-image.svg']).catch(() => {}))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 页面导航
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put('/', copy));
          return res;
        })
        .catch(() => caches.match('/')),
    );
    return;
  }

  // 静态资源：缓存优先
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (
          res.ok &&
          /\.(?:js|css|svg|png|webp|woff2?)$/.test(url.pathname)
        ) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      });
    }),
  );
});
