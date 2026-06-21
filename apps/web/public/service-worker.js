/*
 * Service Worker de Primitivo — estrategias de cache (sección 5 del documento maestro).
 *
 *  - Navegación / documentos HTML: network-first — siempre toma el último deploy
 *    (evita quedar "pinneado" a un bundle viejo); cae al cache solo offline.
 *  - Assets estáticos propios (JS/CSS hasheados): cache-first — carga instantánea.
 *  - Menú y catálogo: stale-while-revalidate.
 *  - Datos en vivo (DNI / compras / canjes): network-first; cache solo como fallback de LECTURA.
 *
 * Regla de integridad: las ESCRITURAS (POST/PUT/PATCH/DELETE) NUNCA se manejan offline ni
 * se encolan. Es crítico para compras y canjes: si no hay conexión, la request falla.
 */

const VERSION = 'v2';
const CACHE_SHELL = `primitivo-shell-${VERSION}`;
const CACHE_CATALOGO = `primitivo-catalogo-${VERSION}`;
const CACHE_LIVE = `primitivo-live-${VERSION}`;
const CACHES_VIGENTES = [CACHE_SHELL, CACHE_CATALOGO, CACHE_LIVE];

self.addEventListener('install', () => {
  // Activa el SW nuevo de inmediato, sin esperar a que se cierren las pestañas viejas.
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

  // 1. ESCRITURAS: solo red, sin cola offline. Crítico para compras/canjes (integridad).
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // 2. Datos en vivo (DNI/compras/canjes): network-first.
  if (esDatosEnVivo(url)) {
    event.respondWith(networkFirst(request, CACHE_LIVE));
    return;
  }

  // 3. Menú/catálogo: stale-while-revalidate.
  if (esCatalogo(url)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_CATALOGO));
    return;
  }

  // 4. Navegación (HTML): network-first para tomar siempre el último deploy.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, CACHE_SHELL));
    return;
  }

  // 5. Assets estáticos propios (hasheados): cache-first.
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

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached; // fallback (offline)
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
