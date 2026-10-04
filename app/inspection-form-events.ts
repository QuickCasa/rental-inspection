import { CONDITIONS, KINDS } from './constants.js'
import { createItem } from './create-room.js'
import { getInspectionPhotos } from './database/photos.js'
import { confirmClick } from './dom.js'
import { formatTimestamp } from './format-timestamp.js'
import { getSigners } from './get-signers.js'
import {
  findItem,
  findRoom,
  form,
  openRooms,
  redrawRoom,
  setStatus,
  state,
  syncSigners,
  syncTitle,
  TEXT_FIELDS,
} from './inspection-page.js'
import { addItemPhotos, removePhotos } from './item-photos.js'
import { openPhotoDialog } from './photo-dialog.js'
import { getPhotoUrl } from './photo-urls.js'
import { pickChoice } from './pick-choice.js'
import { renderThumbnails, syncRoomSummary } from './rooms-editor.js'
import { openSignatureDialog } from './signature-dialog.js'
import type { FormControl, InspectionTextField } from './types.js'

/**
 * Copies a details field, such as the address, into the inspection.
 *
 * @param {FormControl} control The field.
 * @returns {boolean} Whether the control was a details field.
 */
function applyDetail(control: FormControl): boolean {
  const { current } = state
  const { field } = control.dataset

  if (!current || field === undefined) {
    return false
  }

  if (field === 'kind') {
    current.kind = pickChoice(control.value, KINDS) ?? current.kind
    syncTitle()
    return true
  }

  if (!TEXT_FIELDS.has(field)) {
    return false
  }

  current[field as InspectionTextField] = control.value

  if (field === 'landlord' || field === 'tenants') {
    syncSigners()
  }

  return true
}

/**
 * Copies a room's name, or an item's name, notes or rating, into the
 * inspection.
 *
 * @param {FormControl} control The field.
 * @returns {boolean} Whether the control belonged to a room or an item.
 */
function applyRoomOrItem(control: FormControl): boolean {
  const { condition, itemField, roomField } = control.dataset
  const room = findRoom(control)
  const item = findItem(control)

  if (roomField === 'name' && room) {
    room.room.name = control.value
    syncRoomSummary(room.element, room.room)
    return true
  }

  if ((itemField === 'name' || itemField === 'notes') && item) {
    item.item[itemField] = control.value
    return true
  }

  if (condition === undefined || !room || !item) {
    return false
  }

  item.item.condition = pickChoice(control.value, CONDITIONS) ?? ''
  syncRoomSummary(room.element, room.room)
  return true
}

/**
 * Scales down and stores the photos chosen for an item.
 *
 * @param {HTMLInputElement} input The item's file input.
 * @returns {Promise<void>} Resolves once the photos are saved.
 */
async function addPhotos(input: HTMLInputElement): Promise<void> {
  const { current } = state
  const found = findItem(input)
  const files = [...(input.files ?? [])]

  input.value = ''

  if (!current || !found || files.length === 0) {
    return
  }

  setStatus(files.length === 1 ? 'Adding the photo.' : 'Adding the photos.')

  try {
    const skipped = await addItemPhotos(current.id, found.item, files)

    renderThumbnails(found.element, found.item)
    await state.save()
    setStatus(
      skipped === 0
        ? ''
        : `${String(skipped)} of the files couldn't be opened as a photo.`,
    )
  } catch {
    setStatus(
      "The photos couldn't be saved. This device may be out of space. Save a backup file of older inspections, then delete them here.",
    )
  }
}

/**
 * Shows a photo full size, and removes it if asked.
 *
 * @param {HTMLButtonElement} button The photo's thumbnail.
 * @returns {Promise<void>} Resolves once the dialog closes.
 */
async function viewPhoto(button: HTMLButtonElement): Promise<void> {
  const found = findItem(button)
  const id = button.dataset.photoId ?? ''
  const url = getPhotoUrl(id)
  const { current } = state

  if (!found || !current || url === undefined) {
    return
  }

  const photos = await getInspectionPhotos(current.id)
  const record = photos.find(photo => photo.id === id)
  const where = `${found.room.name.trim() || 'Unnamed room'}, ${found.item.name.trim() || 'unnamed item'}.`
  const added = record
    ? ` Added ${formatTimestamp(record.addedAt, current.timeZone)}.`
    : ''
  const choice = await openPhotoDialog(url, `${where}${added}`, !state.locked)

  if (choice !== 'remove' || state.locked) {
    return
  }

  await removePhotos([id])
  found.item.photoIds = found.item.photoIds.filter(photoId => photoId !== id)
  renderThumbnails(found.element, found.item)
  await state.save()
}

/**
 * Asks a signer to sign, then saves the signature and locks the report.
 *
 * @param {string} slot Which signature line was tapped.
 * @returns {Promise<void>} Resolves once the signature is saved, or the dialog is cancelled.
 */
async function sign(slot: string): Promise<void> {
  const { current } = state
  const signer = current
    ? getSigners(current).find(entry => entry.slot === slot)
    : undefined

  if (!current || !signer) {
    return
  }

  await state.flush()

  const input = await openSignatureDialog(signer)

  if (!input || current !== state.current) {
    return
  }

  current.signatures.push({
    slot,
    role: signer.role,
    name: input.name,
    image: input.image,
    signedAt: new Date().toISOString(),
  })
  await state.save()
  syncSigners()
}

/**
 * Adds a blank item to a room and puts the cursor in its name.
 *
 * @param {HTMLButtonElement} button The room's "Add an item" button.
 */
function addItem(button: HTMLButtonElement): void {
  const found = findRoom(button)

  if (!found) {
    return
  }

  const item = createItem('')

  found.room.items.push(item)
  redrawRoom(found.element, found.room)
    .querySelector<HTMLInputElement>(
      `[data-item-id="${CSS.escape(item.id)}"] .item-name`,
    )
    ?.focus()
  state.schedule()
}

/**
 * Removes an item and its photos.
 *
 * @param {HTMLButtonElement} button The item's "Remove" button.
 * @returns {Promise<void>} Resolves once it's gone.
 */
async function removeItem(button: HTMLButtonElement): Promise<void> {
  const found = findItem(button)
  const roomElement = findRoom(button)?.element

  if (!found || !roomElement) {
    return
  }

  await removePhotos(found.item.photoIds)
  found.room.items = found.room.items.filter(item => item !== found.item)
  redrawRoom(roomElement, found.room)
  await state.save()
}

/**
 * Removes a room, its items and their photos.
 *
 * @param {HTMLButtonElement} button The room's "Remove this room" button.
 * @returns {Promise<void>} Resolves once it's gone.
 */
async function removeRoom(button: HTMLButtonElement): Promise<void> {
  const { current } = state
  const found = findRoom(button)

  if (!current || !found) {
    return
  }

  const { element, room } = found

  await removePhotos(room.items.flatMap(item => item.photoIds))
  current.rooms = current.rooms.filter(entry => entry !== room)
  openRooms.delete(room.id)
  element.remove()
  await state.save()
}

/**
 * Wires up the inspection form: typing, ratings, photos, and the buttons
 * inside rooms and signature lines. Everything goes through a few listeners
 * on the form, so redrawn rooms need no wiring of their own.
 */
function setUpFormEvents(): void {
  form.addEventListener('submit', submitEvent => {
    submitEvent.preventDefault()
  })

  form.addEventListener('input', inputEvent => {
    const { target } = inputEvent

    if (!(
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement
    )) {
      return
    }

    if (applyDetail(target) || applyRoomOrItem(target)) {
      state.schedule()
    }
  })

  form.addEventListener('change', async changeEvent => {
    const { target } = changeEvent

    if (
      target instanceof HTMLInputElement &&
      target.dataset.action === 'add-photos'
    ) {
      await addPhotos(target)
    }
  })

  form.addEventListener('click', async clickEvent => {
    const button =
      clickEvent.target instanceof Element
        ? clickEvent.target.closest('button')
        : null

    if (!button || !state.current) {
      return
    }

    const { action } = button.dataset

    if (action === 'add-item') {
      addItem(button)
    } else if (action === 'remove-item' && confirmClick(button)) {
      await removeItem(button)
    } else if (action === 'remove-room' && confirmClick(button)) {
      await removeRoom(button)
    } else if (action === 'view-photo') {
      await viewPhoto(button)
    } else if (action === 'sign') {
      await sign(button.dataset.slot ?? '')
    }
  })
}

export { setUpFormEvents }
