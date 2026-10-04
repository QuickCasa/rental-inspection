import type { Rolldown } from 'vite'

/**
 * Finds the script chunks the app itself loads: each entry, everything it
 * imports, and anything it loads later with import(), such as jsPDF. Chunks
 * that only a library loads on its own, such as jsPDF's optional HTML
 * renderer, are left out, because the app never uses them.
 *
 * @param {Rolldown.OutputBundle} bundle The build output.
 * @param {string} skip An entry to leave out, such as the service worker.
 * @returns {Rolldown.OutputChunk[]} The chunks, in the order they were found.
 */
function findAppChunks(
  bundle: Rolldown.OutputBundle,
  skip: string,
): Rolldown.OutputChunk[] {
  const found = new Map<string, Rolldown.OutputChunk>()

  /**
   * Adds a chunk and what it imports. Static imports are always needed.
   * Dynamic imports count only from the app's own code.
   *
   * @param {string} fileName The chunk.
   * @param {boolean} ownCode Whether the chunk holds the app's own code.
   */
  function add(fileName: string, ownCode: boolean): void {
    const output = bundle[fileName]

    if (output?.type !== 'chunk' || found.has(fileName)) {
      return
    }

    found.set(fileName, output)

    for (const imported of output.imports) {
      add(imported, ownCode)
    }

    if (ownCode) {
      for (const imported of output.dynamicImports) {
        add(imported, false)
      }
    }
  }

  for (const output of Object.values(bundle)) {
    if (output.type === 'chunk' && output.isEntry && output.fileName !== skip) {
      add(output.fileName, true)
    }
  }

  return found.values().toArray()
}

export { findAppChunks }
