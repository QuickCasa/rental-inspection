import type { PrecacheManifest } from '../../build/types.js'

/**
 * The service worker's global scope, plus the manifest the build writes in.
 */
type WorkerScope = ServiceWorkerGlobalScope & {
  __PRECACHE_MANIFEST: PrecacheManifest
}

export type { WorkerScope }
