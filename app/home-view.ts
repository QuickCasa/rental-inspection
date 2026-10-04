import { KINDS } from './constants.js'
import { createInspection } from './create-inspection.js'
import { createMoveOut } from './create-move-out.js'
import {
  deleteInspection,
  getInspection,
  listInspections,
  putInspection,
} from './database/inspections.js'
import { describeSignatures } from './describe-signatures.js'
import { cloneTemplate, confirmClick, getElement } from './dom.js'
import { formatDate } from './format-date.js'
import { importBackup } from './import-backup.js'
import { getInspectionTitle } from './inspection-names.js'
import { pickChoice } from './pick-choice.js'
import type { Inspection } from './types.js'

const list = getElement('inspection-list', HTMLUListElement)
const emptyList = getElement('empty-list', HTMLParagraphElement)
const cardTemplate = getElement('card-template', HTMLTemplateElement)
const status = getElement('home-status', HTMLParagraphElement)
const startForm = getElement('start-form', HTMLFormElement)
const openBackup = getElement('open-backup', HTMLInputElement)

const STORAGE_BLOCKED =
  "This browser won't let the app save anything, so inspections can't be kept. Leave private browsing, or try another browser."

/**
 * Opens an inspection by changing the address, so the back button works.
 *
 * @param {string} id The inspection's id.
 */
function openInspection(id: string): void {
  location.hash = `#/inspection/${id}`
}

/**
 * Asks the browser not to clear the app's storage when the device runs low
 * on space. Browsers decide for themselves, and the app works either way.
 *
 * @returns {Promise<void>} Resolves once the browser answers.
 */
async function requestPersistentStorage(): Promise<void> {
  if (!('storage' in navigator) || !('persist' in navigator.storage)) {
    return
  }

  try {
    await navigator.storage.persist()
  } catch {
    // Saving still works without it.
  }
}

/**
 * Saves a new inspection and opens it.
 *
 * @param {Inspection} inspection The inspection.
 * @returns {Promise<void>} Resolves once it's open.
 */
async function startInspection(inspection: Inspection): Promise<void> {
  try {
    await putInspection(inspection)
    void requestPersistentStorage()
    openInspection(inspection.id)
  } catch {
    status.textContent = STORAGE_BLOCKED
  }
}

/**
 * Draws one inspection's card in the list.
 *
 * @param {Inspection} inspection The inspection.
 * @returns {HTMLElement} The card.
 */
function renderCard(inspection: Inspection): HTMLElement {
  const card = cloneTemplate(cardTemplate)
  const link = card.querySelector<HTMLAnchorElement>('.card-link')
  const meta = card.querySelector('.card-meta')
  const signing = card.querySelector('.card-status')
  const moveOut = card.querySelector<HTMLElement>(
    '[data-action="start-move-out"]',
  )
  const remove = card.querySelector('[data-action="delete"]')
  const title = getInspectionTitle(inspection)
  const address = inspection.address.trim()
  const date = formatDate(inspection.date.trim())

  card.dataset.inspectionId = inspection.id

  if (link) {
    link.href = `#/inspection/${inspection.id}`
    link.textContent = title
  }

  if (meta) {
    meta.textContent = address || 'No address yet'
  }

  if (signing) {
    const signatures = describeSignatures(inspection)
    signing.textContent =
      date === '' ? `${signatures}.` : `${date}. ${signatures}.`
  }

  if (moveOut) {
    moveOut.hidden = inspection.kind !== 'move-in'
  }

  remove?.setAttribute(
    'aria-label',
    `Delete the ${title.toLowerCase()}${address === '' ? '' : ` for ${address}`}`,
  )

  return card
}

/**
 * Lists the inspections saved on this device, newest change first.
 *
 * @returns {Promise<void>} Resolves once the list is drawn.
 */
async function renderHome(): Promise<void> {
  let inspections: Inspection[] = []

  try {
    inspections = await listInspections()
  } catch {
    status.textContent = STORAGE_BLOCKED
  }

  list.replaceChildren(...inspections.map(inspection => renderCard(inspection)))
  emptyList.hidden = inspections.length > 0
}

/**
 * Wires up the start form, the list's buttons and opening a backup file.
 */
function setUpHome(): void {
  startForm.addEventListener('submit', async submitEvent => {
    submitEvent.preventDefault()

    const value = new FormData(startForm).get('kind')
    const kind = pickChoice(typeof value === 'string' ? value : '', KINDS)

    await startInspection(createInspection(kind ?? 'move-in'))
  })

  list.addEventListener('click', async clickEvent => {
    const button =
      clickEvent.target instanceof Element
        ? clickEvent.target.closest('button')
        : null
    const id = button?.closest<HTMLElement>('.card')?.dataset.inspectionId ?? ''

    if (!button || id === '') {
      return
    }

    if (button.dataset.action === 'start-move-out') {
      const source = await getInspection(id)

      if (source) {
        await startInspection(createMoveOut(source))
      }
    } else if (button.dataset.action === 'delete' && confirmClick(button)) {
      await deleteInspection(id)
      status.textContent = 'Deleted, with its photos.'
      await renderHome()
    }
  })

  openBackup.addEventListener('change', async () => {
    const [file] = openBackup.files ?? []

    openBackup.value = ''

    if (!file) {
      return
    }

    try {
      const inspection = await importBackup(file)

      if (inspection) {
        status.textContent = ''
        openInspection(inspection.id)
      } else {
        status.textContent =
          "That file isn't a backup from this app, or it's from a newer version of it."
      }
    } catch {
      status.textContent =
        "The backup couldn't be saved on this device. It may be out of space."
    }
  })
}

export { renderHome, setUpHome }
