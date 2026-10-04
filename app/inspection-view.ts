import { getInspection } from './database/inspections.js'
import { getInspectionPhotos } from './database/photos.js'
import { setUpInspectionActions } from './inspection-actions.js'
import { setUpFormEvents } from './inspection-form-events.js'
import { openRooms, renderAll, setStatus, state } from './inspection-page.js'
import { addPhotoUrl, releaseAllPhotoUrls } from './photo-urls.js'

/**
 * Saves and closes the open inspection, if there is one.
 *
 * @returns {Promise<void>} Resolves once it's saved.
 */
async function closeInspection(): Promise<void> {
  await state.flush()
  state.current = undefined
  openRooms.clear()
  releaseAllPhotoUrls()
}

/**
 * Opens an inspection for editing, with its photos.
 *
 * @param {string} id The inspection's id.
 * @returns {Promise<boolean>} Whether the inspection was found.
 */
async function showInspection(id: string): Promise<boolean> {
  await closeInspection()

  const inspection = await getInspection(id)

  if (!inspection) {
    return false
  }

  const photos = await getInspectionPhotos(id)

  for (const photo of photos) {
    addPhotoUrl(photo.id, photo.blob)
  }

  state.current = inspection
  setStatus('')
  renderAll()

  return true
}

/**
 * Saves any change still waiting, such as before the app reloads to update.
 *
 * @returns {Promise<boolean>} Whether the save worked.
 */
function saveNow(): Promise<boolean> {
  return state.flush()
}

/**
 * Wires up the inspection screen, once, when the app starts.
 */
function setUpInspection(): void {
  setUpFormEvents()
  setUpInspectionActions()
}

export { closeInspection, saveNow, setUpInspection, showInspection }
