import { createHash } from 'node:crypto'
import type { BuildFile, PrecacheManifest } from './types.js'

/**
 * Lists the files to cache for offline use, sorted so the same build always
 * gives the same manifest, with a version that changes whenever any file's
 * name or contents change.
 *
 * @param {readonly BuildFile[]} files The files to cache.
 * @returns {PrecacheManifest} The manifest.
 */
function createPrecacheManifest(files: readonly BuildFile[]): PrecacheManifest {
  const sorted = files.toSorted((first, second) =>
    first.fileName.localeCompare(second.fileName),
  )
  const hash = createHash('sha256')

  for (const file of sorted) {
    hash.update(file.fileName)
    hash.update('\0')
    hash.update(file.content)
    hash.update('\0')
  }

  return {
    version: hash.digest('hex').slice(0, 16),
    files: sorted.map(file => `./${file.fileName}`),
  }
}

export { createPrecacheManifest }
