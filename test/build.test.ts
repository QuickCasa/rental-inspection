import type { Rolldown } from 'vite'
import { describe, expect, it } from 'vitest'
import { createPrecacheManifest } from '../build/create-precache-manifest.js'
import { findAppChunks } from '../build/find-app-chunks.js'

/**
 * Makes a stand-in for a chunk in the build output, with only the fields the
 * service worker plugin reads.
 *
 * @param {string} fileName The chunk's file.
 * @param {Partial<Rolldown.OutputChunk>} details The fields to set.
 * @returns {Rolldown.OutputChunk} The chunk.
 */
function chunk(
  fileName: string,
  details: Partial<Rolldown.OutputChunk> = {},
): Rolldown.OutputChunk {
  return {
    type: 'chunk',
    fileName,
    isEntry: false,
    imports: [],
    dynamicImports: [],
    code: '',
    ...details,
  } as Rolldown.OutputChunk
}

describe('createPrecacheManifest', () => {
  it('sorts the files and changes version when any file changes', () => {
    const first = createPrecacheManifest([
      { fileName: 'index.html', content: '<p>One</p>' },
      { fileName: 'assets/app.js', content: 'run()' },
    ])
    const same = createPrecacheManifest([
      { fileName: 'assets/app.js', content: 'run()' },
      { fileName: 'index.html', content: '<p>One</p>' },
    ])
    const changed = createPrecacheManifest([
      { fileName: 'assets/app.js', content: 'run()' },
      { fileName: 'index.html', content: '<p>Two</p>' },
    ])

    expect(first.files).toEqual(['./assets/app.js', './index.html'])
    expect(same.version).toBe(first.version)
    expect(changed.version).not.toBe(first.version)
  })
})

describe('findAppChunks', () => {
  it("follows the app's imports, but not a library's optional ones", () => {
    const bundle: Rolldown.OutputBundle = {
      'assets/index.js': chunk('assets/index.js', {
        isEntry: true,
        imports: ['assets/shared.js'],
        dynamicImports: ['assets/jspdf.js'],
      }),
      'assets/shared.js': chunk('assets/shared.js'),
      'assets/jspdf.js': chunk('assets/jspdf.js', {
        imports: ['assets/shared.js'],
        dynamicImports: ['assets/html2canvas.js'],
      }),
      'assets/html2canvas.js': chunk('assets/html2canvas.js'),
      'sw.js': chunk('sw.js', { isEntry: true }),
    }

    const names = findAppChunks(bundle, 'sw.js').map(found => found.fileName)

    expect(
      names.toSorted((first, second) => first.localeCompare(second)),
    ).toEqual(['assets/index.js', 'assets/jspdf.js', 'assets/shared.js'])
  })
})
