import { BASELINE_PHRASES, CONDITION_LABELS, CONDITIONS } from './constants.js'
import { describeBaseline } from './describe-baseline.js'
import { cloneTemplate } from './dom.js'
import { getRoomProgress } from './get-room-progress.js'
import { getPhotoUrl } from './photo-urls.js'
import type {
  EditorTemplates,
  Inspection,
  InspectionItem,
  Room,
} from './types.js'

/**
 * Updates a room's heading: its name, and how many items are rated.
 *
 * @param {HTMLElement} element The room's element.
 * @param {Room} room The room.
 */
function syncRoomSummary(element: HTMLElement, room: Room): void {
  const title = element.querySelector('.room-title')
  const progress = element.querySelector('.room-progress')
  const { poor, rated, total } = getRoomProgress(room)

  if (title) {
    title.textContent = room.name.trim() || 'Unnamed room'
  }

  if (!progress) {
    return
  }

  const poorText = poor > 0 ? `, ${String(poor)} poor` : ''
  progress.textContent = `${String(rated)} of ${String(total)} rated${poorText}`
}

/**
 * Draws an item's photo thumbnails. Each one is a button that opens the
 * photo, and stays usable when the report is locked.
 *
 * @param {HTMLElement} element The item's element.
 * @param {InspectionItem} item The item.
 */
function renderThumbnails(element: HTMLElement, item: InspectionItem): void {
  const list = element.querySelector('.thumbnails')

  if (!list) {
    return
  }

  const name = item.name.trim() || 'this item'

  const thumbnails = item.photoIds.flatMap((id, index) => {
    const url = getPhotoUrl(id)

    if (url === undefined) {
      return []
    }

    const entry = document.createElement('li')
    const button = document.createElement('button')
    const image = document.createElement('img')

    button.type = 'button'
    button.className = 'thumbnail'
    button.dataset.action = 'view-photo'
    button.dataset.photoId = id
    button.dataset.unlocked = ''
    image.src = url
    image.alt = `Photo ${String(index + 1)} of ${name}`
    button.append(image)
    entry.append(button)

    return [entry]
  })

  list.replaceChildren(...thumbnails)
}

/**
 * Draws one item: its name, the rating buttons, its move-in rating when
 * there is one, notes and photos. Values are set as properties, never as
 * HTML, so nothing anyone types can change the page.
 *
 * @param {HTMLTemplateElement} template The item template.
 * @param {InspectionItem} item The item.
 * @param {string} phrase How to refer to the earlier inspection, or an empty string when there isn't one.
 * @returns {HTMLElement} The item's element.
 */
function renderItem(
  template: HTMLTemplateElement,
  item: InspectionItem,
  phrase: string,
): HTMLElement {
  const element = cloneTemplate(template)
  const name = item.name.trim() || 'this item'
  const nameInput = element.querySelector<HTMLInputElement>(
    '[data-item-field="name"]',
  )
  const notes = element.querySelector<HTMLTextAreaElement>(
    '[data-item-field="notes"]',
  )
  const conditions = element.querySelector('.conditions')
  const baseline = element.querySelector<HTMLElement>('.item-baseline')
  const remove = element.querySelector('[data-action="remove-item"]')

  element.dataset.itemId = item.id

  if (nameInput) {
    nameInput.value = item.name
  }

  if (notes) {
    notes.value = item.notes
    notes.setAttribute('aria-label', `Notes on ${name}`)
  }

  remove?.setAttribute('aria-label', `Remove ${name}`)

  if (conditions) {
    const legend = conditions.querySelector('legend')

    if (legend) {
      legend.textContent = `Condition of ${name}`
    }

    for (const condition of CONDITIONS) {
      const label = document.createElement('label')
      const radio = document.createElement('input')
      const text = document.createElement('span')

      label.className = `condition condition-${condition}`
      radio.type = 'radio'
      radio.name = `condition-${item.id}`
      radio.value = condition
      radio.dataset.condition = ''
      radio.checked = item.condition === condition
      text.textContent = CONDITION_LABELS[condition]
      label.append(radio, text)
      conditions.append(label)
    }
  }

  if (baseline && phrase !== '') {
    baseline.hidden = false
    baseline.textContent = `At ${phrase}: ${describeBaseline(item.baseline)}`
  }

  renderThumbnails(element, item)

  return element
}

/**
 * Draws one room as a section that opens and closes, with its items.
 *
 * @param {EditorTemplates} templates The page templates.
 * @param {Room} room The room.
 * @param {boolean} open Whether it starts open.
 * @param {string} phrase How to refer to the earlier inspection, or an empty string.
 * @returns {HTMLElement} The room's element.
 */
function renderRoom(
  templates: EditorTemplates,
  room: Room,
  open: boolean,
  phrase: string,
): HTMLElement {
  const element = cloneTemplate(templates.room)
  const nameInput = element.querySelector<HTMLInputElement>(
    '[data-room-field="name"]',
  )
  const items = element.querySelector('.items')

  element.dataset.roomId = room.id

  if (element instanceof HTMLDetailsElement) {
    element.open = open
  }

  if (nameInput) {
    nameInput.value = room.name
  }

  items?.replaceChildren(
    ...room.items.map(item => renderItem(templates.item, item, phrase)),
  )
  syncRoomSummary(element, room)

  return element
}

/**
 * Draws every room. Rooms that were open stay open.
 *
 * @param {HTMLElement} container Where the rooms go.
 * @param {EditorTemplates} templates The page templates.
 * @param {Inspection} inspection The inspection.
 * @param {ReadonlySet<string>} openRooms The ids of the rooms that are open.
 */
function renderRooms(
  container: HTMLElement,
  templates: EditorTemplates,
  inspection: Inspection,
  openRooms: ReadonlySet<string>,
): void {
  const phrase = inspection.baseline
    ? BASELINE_PHRASES[inspection.baseline.kind]
    : ''

  container.replaceChildren(
    ...inspection.rooms.map(room =>
      renderRoom(templates, room, openRooms.has(room.id), phrase),
    ),
  )
}

export { renderRoom, renderRooms, renderThumbnails, syncRoomSummary }
