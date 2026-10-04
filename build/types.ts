/**
 * The files the service worker keeps for offline use, written into the
 * worker at build time.
 */
interface PrecacheManifest {
  /**
   * A hash of every file's name and contents. A new deploy gets a new
   * version, and so a new cache.
   */
  version: string
  /**
   * Paths relative to the worker, such as "./assets/index-abc123.js".
   */
  files: string[]
}

/**
 * A file the build writes, by its path in the output folder.
 */
interface BuildFile {
  fileName: string
  content: string | Uint8Array
}

export type { BuildFile, PrecacheManifest }
