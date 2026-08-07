/* ─────────────────────────────────────────────────────────────────────────
   BUILD_DATE: atualize ao fazer deploy para invalidar o cache do app shell.
   Fonts e ícones usam caches separados com nomes fixos — não precisam mudar.
   ───────────────────────────────────────────────────────────────────────── */
const BUILD_DATE  = '20260807';
const CACHE_APP   = `difusor-app-${BUILD_DATE}`;  // Stale-While-Revalidate
const CACHE_FONTS = 'difusor-fonts-v1';            // Cache-First (Google Fonts)
const CACHE_IMGS  = 'difusor-imgs-v1';             // Cache-Only (ícones)

const ALL_CACHES  = [CACHE_APP, CACHE_FONTS, CACHE_IMGS];

const APP_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

/* ── INSTALL: pré-cache do app shell ─────────────────────────────────── */
self.addEventListener('install', e =>
  e.waitUntil(
    caches.open(CACHE_APP)
      .then(c => c.addAll(APP_ASSETS))
      .then(() => self.skipWaiting())
  )
);

/* ── ACTIVATE: remove caches obsoletos e notifica abas abertas ───────── */
self.addEventListener('activate', e =>
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => !ALL_CACHES.includes(k))
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
      .then(() => {
        /* Avisa todas as abas que existe uma nova versão ativa */
        return self.clients.matchAll({ type: 'window' }).then(clients =>
          clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' }))
        );
      })
  )
);

/* ── FETCH: estratégias diferentes por tipo de recurso ───────────────── */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  /* Google Fonts (googleapis + gstatic) → Cache-First, aceita opaque */
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(cacheFontsFirst(e.request));
    return;
  }

  /* manifest.webmanifest → Network-First (crítico para PWA funcionar) */
  if (url.pathname.endsWith('manifest.webmanifest')) {
    e.respondWith(networkFirst(e.request, CACHE_APP));
    return;
  }

  /* Ícones → Cache-Only (pré-cacheados no install, raramente mudam) */
  if (url.pathname.includes('/icons/')) {
    e.respondWith(cacheOnly(e.request));
    return;
  }

  /* App shell (html, css, js) → Stale-While-Revalidate */
  e.respondWith(staleWhileRevalidate(e.request, CACHE_APP));
});

/* ── Implementações das estratégias ─────────────────────────────────── */

/**
 * Stale-While-Revalidate
 * Retorna o cache imediatamente (sem esperar a rede) e atualiza em background.
 * Garante carregamento instantâneo offline e dados frescos na próxima visita.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(resp => {
      if (resp && resp.status === 200) cache.put(request, resp.clone());
      return resp;
    })
    .catch(() => cached); /* fallback silencioso se offline */

  return cached || fetchPromise;
}

/**
 * Network-First
 * Tenta a rede; em caso de falha, usa o cache.
 * Ideal para o manifest, que o navegador valida frequentemente.
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const resp = await fetch(request);
    if (resp && resp.status === 200) cache.put(request, resp.clone());
    return resp;
  } catch {
    const cached = await cache.match(request);
    return cached || caches.match('./index.html');
  }
}

/**
 * Cache-Only
 * Serve direto do cache; faz fetch somente se não estiver cacheado (fallback).
 * Usado para ícones que foram pré-cacheados no install.
 */
async function cacheOnly(request) {
  const cached = await caches.match(request);
  return cached || fetch(request);
}

/**
 * Cache-First para Google Fonts
 * Aceita respostas opaque (type === 'opaque', status === 0) que ocorrem
 * em cross-origin sem CORS — comportamento normal para fontes externas.
 */
async function cacheFontsFirst(request) {
  const cache  = await caches.open(CACHE_FONTS);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const resp = await fetch(request);
    /* status 200 = normal | type 'opaque' = cross-origin sem CORS (ok para fontes) */
    if (resp && (resp.status === 200 || resp.type === 'opaque')) {
      cache.put(request, resp.clone());
    }
    return resp;
  } catch {
    /* Offline e sem cache — retorna 503 silencioso; o fallback de fonte do CSS assume */
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}
