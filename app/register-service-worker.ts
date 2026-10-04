/**
 * Registers the service worker that keeps the app working offline, in the
 * production build only. When a new version has downloaded, `onUpdate` gets
 * a function that switches to it and reloads the page.
 *
 * @param {(apply: () => void) => void} onUpdate Offers the update to the person using the app.
 * @returns {Promise<void>} Resolves once the worker is registered, or the browser declines.
 */
async function registerServiceWorker(
  onUpdate: (apply: () => void) => void,
): Promise<void> {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) {
    return
  }

  const { serviceWorker } = navigator
  let updating = false

  /**
   * Offers a waiting version of the app.
   *
   * @param {ServiceWorker} worker The new version's worker.
   */
  function offer(worker: ServiceWorker): void {
    onUpdate(() => {
      updating = true
      worker.postMessage('skip-waiting')
    })
  }

  // The first install also changes the controller, and that must not reload
  // the page, so only a requested update does.
  serviceWorker.addEventListener('controllerchange', () => {
    if (updating) {
      location.reload()
    }
  })

  let registration: ServiceWorkerRegistration

  try {
    registration = await serviceWorker.register('./sw.js')
  } catch {
    // Without the worker the app still works, just not offline.
    return
  }

  if (registration.waiting && serviceWorker.controller) {
    offer(registration.waiting)
  }

  registration.addEventListener('updatefound', () => {
    const worker = registration.installing

    worker?.addEventListener('statechange', () => {
      if (worker.state === 'installed' && serviceWorker.controller) {
        offer(worker)
      }
    })
  })
}

export { registerServiceWorker }
