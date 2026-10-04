import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import { createPrecacheManifest } from './create-precache-manifest.js'
import { findAppChunks } from './find-app-chunks.js'
import type { BuildFile } from './types.js'

const WORKER_FILE = 'sw.js'
const PLACEHOLDER = 'self.__PRECACHE_MANIFEST'

/**
 * Reads every file in the public folder, which Vite copies into the output
 * as it is, such as the icons and the web app manifest.
 *
 * @param {string} directory The public folder.
 * @returns {BuildFile[]} The files, by their path in the output.
 */
function readPublicFiles(directory: string): BuildFile[] {
  return readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => {
      const fullPath = path.join(entry.parentPath, entry.name)

      return {
        fileName: path.relative(directory, fullPath).split(path.sep).join('/'),
        content: readFileSync(fullPath),
      }
    })
}

/**
 * Writes the list of files to cache into the service worker, replacing its
 * self.__PRECACHE_MANIFEST read. The list is the page, its styles, the
 * scripts the app loads and the public files, so the app opens and makes
 * PDFs with no connection.
 *
 * @returns {Plugin} The Vite plugin.
 */
function serviceWorkerPlugin(): Plugin {
  let publicDirectory = ''

  return {
    name: 'rental-inspection:service-worker',
    apply: 'build',

    configResolved(config) {
      publicDirectory = config.publicDir
    },

    // Runs after Vite's own plugins, which add index.html to the bundle.
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const worker = bundle[WORKER_FILE]

        if (worker?.type !== 'chunk' || !worker.code.includes(PLACEHOLDER)) {
          throw new Error(
            `The build has no ${WORKER_FILE} that reads ${PLACEHOLDER}.`,
          )
        }

        const chunks = findAppChunks(bundle, WORKER_FILE).map(chunk => ({
          fileName: chunk.fileName,
          content: chunk.code,
        }))
        const assets = Object.values(bundle)
          .filter(output => output.type === 'asset')
          .filter(output => !output.fileName.endsWith('.map'))
          .map(output => ({
            fileName: output.fileName,
            content: output.source,
          }))
        const manifest = createPrecacheManifest([
          ...chunks,
          ...assets,
          ...(publicDirectory === '' ? [] : readPublicFiles(publicDirectory)),
        ])

        if (!manifest.files.includes('./index.html')) {
          throw new Error(
            'The service worker would cache the app without its page.',
          )
        }

        // A function, so a $ in a file name can't be read as a replacement
        // pattern.
        const json = JSON.stringify(manifest)
        worker.code = worker.code.replaceAll(PLACEHOLDER, () => json)
      },
    },
  }
}

export { serviceWorkerPlugin }
