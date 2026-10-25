// 오프라인 대비 서비스 워커 (PWA)
// - 화면 틀(HTML·CSS·JS·폰트·아이콘)은 설치할 때 미리 받아 둔다.
// - 나머지(이미지, 가상 나이스·에듀파인 파일, QR·구글 폰트)는 한 번 열면 저장해 두고, 다음부터는 저장본을 먼저 보여 주며 뒤에서 새로 받는다.
// - 페이지(HTML)·CSS·JS는 인터넷을 먼저 시도하고, 안 되면 저장본을 쓴다(배포한 수정이 바로 보이게).
// - 영상(mp4)·Codex 브리지·자동 찾기 요청은 건드리지 않는다.
const CACHE = 'midong-v2';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest',
  'css/deck.css', 'css/codex.css', 'js/deck.js', 'js/codex.js',
  'assets/fonts/Paperlogy-5Medium.ttf', 'assets/fonts/Paperlogy-6SemiBold.ttf', 'assets/fonts/Paperlogy-7Bold.ttf', 'assets/fonts/Paperlogy-8ExtraBold.ttf',
  'assets/img/icon-192.png', 'assets/img/icon-512.png', 'assets/img/char-jump.png',
];
const CDN = ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === location.origin;
  if (!same && !CDN.includes(url.hostname)) return;              // 브리지·ntfy 등은 그대로
  if (same && (/\.(mp4|webm|bat)$/i.test(url.pathname) || req.headers.has('range'))) return;

  // 페이지·CSS·JS는 인터넷 먼저(고친 내용이 바로 보이게), 안 되면 저장본
  if (req.mode === 'navigate' || (same && /\.(css|js|html|webmanifest)$/i.test(url.pathname))) {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
        return res;
      } catch {
        return (await caches.match(req, { ignoreSearch: true })) || (await caches.match('index.html'));
      }
    })());
    return;
  }
  e.respondWith((async () => {                                     // 나머지: 저장본 먼저, 뒤에서 새로 받기
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req);
    const fresh = fetch(req).then(res => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(fresh); return hit; }
    return (await fresh) || new Response('', { status: 504 });
  })());
});
