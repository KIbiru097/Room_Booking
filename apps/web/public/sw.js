const CACHE_NAME = "luxstay-static-v2"
const PAGE_CACHE_NAME = "luxstay-pages-v1"
const OFFLINE_URL = "/offline.html"

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache
          .addAll([
            OFFLINE_URL,
            "/icons/luxstay-192.svg",
            "/icons/luxstay-512.svg",
          ])
          .catch(() => undefined),
      ),
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![CACHE_NAME, PAGE_CACHE_NAME].includes(key))
            .map((key) => caches.delete(key)),
        ),
      ),
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const request = event.request
  const url = new URL(request.url)

  // Never cache API/auth responses or cross-origin resources. This prevents stale
  // account data and avoids putting private responses into a shared cache.
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/")
  )
    return

  if (request.mode === "navigate") {
    event.respondWith(caches.open(PAGE_CACHE_NAME).then(async (cache) => {
        try {
          const response = await fetch(request)
          if (response.ok) void cache.put(request, response.clone())
          return response
        } catch {
          return (await cache.match(request)) || caches.match(OFFLINE_URL)
        }
      }))
    return
  }

  // Cache immutable app assets and local icons; use network-first for everything else.
  const cacheable =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/")
  if (!cacheable) return

  event.respondWith(caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone()
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        }
        return response
      })
      return cached || network
    }))
})
