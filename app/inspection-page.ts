import { BASELINE_PHRASES, KIND_LABELS } from './constants.js'
import { getElement } from './dom.js'
import { formatDate } from './format-date.js'
import { getInspectionTitle } from './inspection-names.js'
import { InspectionState } from './inspection-state.js'
import { renderRoom, renderRooms } from './rooms-editor.js'
import { renderSigners } from './signers-editor.js'
import type {
  EditorTemplates,
  InspectionTextField,
  ItemLocation,
  Room,
  RoomLocation,
} from './types.js'

const TEXT_FIELDS: ReadonlySet<string> = new Set([
  'address',
  'date',
  'landlord',
  'tenants',
  'keys',
  'meters',
  'notes',
  'tenantComments',
])

const SAVE_FAILED =
  "This browser couldn't save your changes. Download the PDF or save a backup file before you close the page."

const form = getElement('inspection-form', HTMLFormElement)
const title = getElement('inspection-title', HTMLHeadingElement)
const roomsContainer = getElement('rooms', HTMLDivElement)
const signersList = getElement('signers', HTMLUListElement)
const status = getElement('inspection-status', HTMLParagraphElement)
const baselineBanner = getElement('baseline-banner', HTMLDivElement)
const baselineText = getElement('baseline-text', HTMLParagraphElement)
const lockedBanner = getElement('locked-banner', HTMLDivElement)
const templates: EditorTemplates = {
  room: getElement('room-template', HTMLTemplateElement),
  item: getElement('item-template', HTMLTemplateElement),
}

/**
 * The open inspection. A failed save says so on the page, and the message
 * goes away once a save works again.
 */
const state = new InspectionState(saved => {
  if (!saved) {
    status.textContent = SAVE_FAILED
  } else if (status.textContent === SAVE_FAILED) {
    status.textContent = ''
  }
})

/**
 * The ids of the rooms that are open, so they stay open when redrawn.
 */
const openRooms = new Set<string>()

/**
 * Says how the earlier inspection is referred to, such as "move-in".
 *
 * @returns {string} The phrase, or an empty string when there's no earlier inspection.
 */
function baselinePhrase(): string {
  const baseline = state.current?.baseline
  return baseline ? BASELINE_PHRASES[baseline.kind] : ''
}

/**
 * Shows a message about the open inspection, or clears it.
 *
 * @param {string} message The message, or an empty string.
 */
function setStatus(message: string): void {
  status.textContent = message
}

/**
 * Disables every control that changes the report once someone has signed,
 * leaving signing, viewing photos and the report buttons usable.
 */
function applyLock(): void {
  const { locked } = state

  lockedBanner.hidden = !locked
  form.classList.toggle('locked', locked)

  for (const control of form.querySelectorAll<
    | HTMLButtonElement
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement
  >('button, input, select, textarea')) {
    control.disabled = locked && control.dataset.unlocked === undefined
  }
}

/**
 * Updates the heading and the page title to the inspection's type.
 */
function syncTitle(): void {
  const { current } = state

  if (!current) {
    return
  }

  title.textContent = getInspectionTitle(current)
  document.title = `${getInspectionTitle(current)} | QuickCasa Rental Inspection`
}

/**
 * Redraws the signature lines, which follow the landlord and tenant names.
 */
function syncSigners(): void {
  if (!state.current) {
    return
  }

  renderSigners(signersList, state.current)
  applyLock()
}

/**
 * Copies the inspection into every field and redraws the rooms and
 * signatures.
 */
function renderAll(): void {
  const { current } = state

  if (!current) {
    return
  }

  for (const control of form.querySelectorAll<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >('[data-field]')) {
    const field = control.dataset.field ?? ''

    if (field === 'kind') {
      control.value = current.kind
    } else if (TEXT_FIELDS.has(field)) {
      control.value = current[field as InspectionTextField]
    }
  }

  const { baseline } = current

  baselineBanner.hidden = baseline === null

  if (baseline) {
    baselineText.textContent = `Compared with the ${KIND_LABELS[baseline.kind].toLowerCase()} inspection of ${formatDate(baseline.date)}. Each item shows how it looked then.`
  }

  syncTitle()
  renderRooms(roomsContainer, templates, current, openRooms)
  syncSigners()
}

/**
 * Finds the room a control belongs to.
 *
 * @param {Element} control A control inside a room.
 * @returns {RoomLocation | undefined} The room and its element.
 */
function findRoom(control: Element): RoomLocation | undefined {
  const element = control.closest<HTMLElement>('.room')
  const room = state.current?.rooms.find(
    entry => entry.id === element?.dataset.roomId,
  )

  return element && room ? { element, room } : undefined
}

/**
 * Finds the item a control belongs to.
 *
 * @param {Element} control A control inside an item.
 * @returns {ItemLocation | undefined} The item, its room and its element.
 */
function findItem(control: Element): ItemLocation | undefined {
  const element = control.closest<HTMLElement>('.item')
  const room = findRoom(control)?.room
  const item = room?.items.find(entry => entry.id === element?.dataset.itemId)

  return element && room && item ? { element, room, item } : undefined
}

/**
 * Draws a room, open, with the page's lock applied.
 *
 * @param {Room} room The room.
 * @returns {HTMLElement} The room's element.
 */
function drawOpenRoom(room: Room): HTMLElement {
  const element = renderRoom(templates, room, true, baselinePhrase())

  openRooms.add(room.id)
  return element
}

/**
 * Redraws one room in place, open, after an item is added or removed.
 *
 * @param {HTMLElement} element The room's element.
 * @param {Room} room The room.
 * @returns {HTMLElement} The new element.
 */
function redrawRoom(element: HTMLElement, room: Room): HTMLElement {
  const fresh = drawOpenRoom(room)

  element.replaceWith(fresh)
  applyLock()

  return fresh
}

export {
  applyLock,
  drawOpenRoom,
  findItem,
  findRoom,
  form,
  openRooms,
  redrawRoom,
  renderAll,
  roomsContainer,
  setStatus,
  state,
  syncSigners,
  syncTitle,
  TEXT_FIELDS,
}
