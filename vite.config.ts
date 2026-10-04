import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { serviceWorkerPlugin } from './build/service-worker-plugin.js'

const WORKER_ENTRY = 'sw'

/**
 * Vite builds the app in app/ into site/ for GitHub Pages, with the service
 * worker as a second entry written to site/sw.js. The tests run in Node.
 */
const config = defineConfig({
  root: 'app',
  base: './',
  plugins: [serviceWorkerPlugin()],
  build: {
    outDir: '../site',
    emptyOutDir: true,
    rolldownOptions: {
      input: {
        index: fileURLToPath(new URL('app/index.html', import.meta.url)),
        [WORKER_ENTRY]: fileURLToPath(
          new URL('app/service-worker/sw.ts', import.meta.url),
        ),
      },
      output: {
        entryFileNames: chunk =>
          chunk.name === WORKER_ENTRY ? 'sw.js' : 'assets/[name]-[hash].js',
      },
    },
  },
  test: {
    root: '.',
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
})

export default config
