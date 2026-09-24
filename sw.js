/* Service worker: permite usar Perezoso sin internet y instalarlo como app.
 * Estrategia: responde desde la caché al instante y actualiza en segundo plano,
 * así los cambios nuevos aparecen la próxima vez que se abre.
 * Si cambiás la lista de archivos, subí el número de versión.
 */
const CACHE = 'perezoso-v5';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css',
  'img/perezoso.svg', 'img/icon-192.png', 'img/icon-512.png',
  'js/vendor/jspdf.umd.min.js', 'js/util.js', 'js/store.js', 'js/phrases.js', 'js/sloth.js', 'js/theme.js',
  'js/calendar.js', 'js/subjects.js', 'js/study.js', 'js/pomodoro.js', 'js/projects.js', 'js/slothpage.js',
  'js/home.js', 'js/settings.js', 'js/autosave.js', 'js/app.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== self.location.origin && !isFont) return;

  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const fresh = fetch(req)
        .then((res) => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; })
        .catch(() => cached || (req.mode === 'navigate' ? cache.match('index.html') : undefined));
      return cached || fresh;
    }),
  );
});
