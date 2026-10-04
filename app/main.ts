import '@fontsource-variable/space-grotesk/wght.css'
import './styles.css'
import { getElement } from './dom.js'
import { renderHome, setUpHome } from './home-view.js'
import {
  closeInspection,
  saveNow,
  setUpInspection,
  showInspection,
} from './inspection-view.js'
import { registerServiceWorker } from './register-service-worker.js'

const HOME_TITLE = document.title
const INSPECTION_ROUTE = /^#\/inspection\/([\w-]+)$/u

const homeView = getElement('home-view', HTMLElement)
const inspectionView = getElement('inspection-view', HTMLElement)
const updateBanner = getElement('update-banner', HTMLDivElement)
const updateNow = getElement('update-now', HTMLButtonElement)

let applyUpdate: (() => void) | undefined

/**
 * Shows the screen the address asks for: an inspection, or the list.
 *
 * @returns {Promise<void>} Resolves once the screen is drawn.
 */
async function route(): Promise<void> {
  const [, id] = INSPECTION_ROUTE.exec(location.hash) ?? []

  if (id !== undefined && (await showInspection(id))) {
    homeView.hidden = true
    inspectionView.hidden = false
    window.scrollTo(0, 0)
    return
  }

  if (id !== undefined) {
    // An inspection that's been deleted, or that lives on another device.
    history.replaceState(null, '', `${location.pathname}${location.search}`)
  }

  await closeInspection()
  await renderHome()
  document.title = HOME_TITLE
  inspectionView.hidden = true
  homeView.hidden = false
}

setUpHome()
setUpInspection()

window.addEventListener('hashchange', () => {
  void route()
})

updateNow.addEventListener('click', async () => {
  await saveNow()
  applyUpdate?.()
})

void registerServiceWorker(apply => {
  applyUpdate = apply
  updateBanner.hidden = false
})

void route()
