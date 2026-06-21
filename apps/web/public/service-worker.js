/*
 * Service Worker de Primitivo — estrategias de cache (sección 5 del documento maestro).
 *
 *  - App shell (HTML/JS/CSS y assets same-origin): cache-first.
 *  - Menú y catálogo (cambian poco): stale-while-revalidate.
 *  - Datos en vivo (DNI / compras / canjes): network-first; cache solo como fallback de LECTURA.
 *
 * Regla de integridad: las ESCRITURAS (POST/PUT/PATCH/DELETE) NUNCA se manejan offline ni
 * se encolan. Es crítico para compras y canjes: si no hay conexión, la request falla y la
 * app muestra el estado "sin conexión". El offline se reserva solo para lectura.
 */

const CACHE_SHELL = 'primitivo-shell-v1';
const CACHE_CATALOGO = 'primitivo-catalogo-v1';
const CACHE_LIVE = 'primitivo-live-v1';
const CACHES_VIGENTES = [CACHE_SHELL, CACHE_CATALOGO, CACHE_LIVE];

// App shell mínimo a precachear en la instalación.
const SHELL_ASSETS = ['/', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_SHELL).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !CACHES_VIGENTES.includes(k)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

function esCatalogo(url) {
  return /\/api\/v1\/(menu|productos|categorias)/.test(url.pathname);
}

function esDatosEnVivo(url) {
  return /\/api\/v1\/(clientes|compras|canjes)/.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. ESCRITURAS: solo red, sin cola offline. Crítico para compras/canjes (integridad).
  if (request.method !== 'GET') {
    return; // se deja pasar a la red; sin conexión, falla (la UI lo muestra).
  }

  // 2. Datos en vivo (DNI/compras/canjes): network-first.
  if (esDatosEnVivo(url)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 3. Menú/catálogo: stale-while-revalidate.
  if (esCatalogo(url)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_CATALOGO));
    return;
  }

  // 4. App shell y assets propios: cache-first.
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, CACHE_SHELL));
    return;
  }

  // Resto (terceros): red directa, sin cachear.
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_LIVE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached; // fallback de lectura
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetching = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || fetching;
}
