import type { WorkerScope } from './types.js'

declare const self: WorkerScope

const CACHE_PREFIX = 'rental-inspection-'

// The build replaces this property read with the real manifest. See
// build/service-worker-plugin.ts.
const manifest = self.__PRECACHE_MANIFEST
const cacheName = `${CACHE_PREFIX}${manifest.version}`

/**
 * Downloads every file the app needs, so it opens and makes PDFs offline.
 *
 * @returns {Promise<void>} Resolves once everything is cached.
 */
async function precache(): Promise<void> {
  const cache = await caches.open(cacheName)
  await cache.addAll(manifest.files)
}

/**
 * Deletes the caches of older versions, then takes control of open pages so
 * the first visit works offline without a reload.
 *
 * @returns {Promise<void>} Resolves once the old caches are gone.
 */
async function activate(): Promise<void> {
  const names = await caches.keys()
  const stale = names.filter(
    name => name.startsWith(CACHE_PREFIX) && name !== cacheName,
  )

  await Promise.all(stale.map(name => caches.delete(name)))
  await self.clients.claim()
}

/**
 * Answers a request from the cache, and falls back to the network for
 * anything that isn't cached yet. Every page load gets the cached app, which
 * is what lets it open with no connection.
 *
 * @param {Request} request The request.
 * @returns {Promise<Response>} The response.
 */
async function respond(request: Request): Promise<Response> {
  const cache = await caches.open(cacheName)

  if (request.mode === 'navigate') {
    const page = await cache.match('./index.html')
    return page ?? fetch(request)
  }

  const cached = await cache.match(request)

  if (cached) {
    return cached
  }

  const response = await fetch(request)

  if (response.ok && response.type === 'basic') {
    await cache.put(request, response.clone())
  }

  return response
}

self.addEventListener('install', installEvent => {
  installEvent.waitUntil(precache())
})

self.addEventListener('activate', activateEvent => {
  activateEvent.waitUntil(activate())
})

self.addEventListener('fetch', fetchEvent => {
  const { request } = fetchEvent

  if (
    request.method !== 'GET' ||
    new URL(request.url).origin !== self.location.origin
  ) {
    return
  }

  fetchEvent.respondWith(respond(request))
})

// A new version waits until every tab of the old one closes, unless the page
// asks it to take over, which it does when someone taps "Update now".
self.addEventListener('message', messageEvent => {
  if (messageEvent.data === 'skip-waiting') {
    void self.skipWaiting()
  }
})
