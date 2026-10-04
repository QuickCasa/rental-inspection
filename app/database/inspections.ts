import { normalizeInspection } from '../normalize-inspection.js'
import type { Inspection, JsonValue } from '../types.js'
import {
  BY_INSPECTION,
  INSPECTIONS,
  openDatabase,
  PHOTOS,
  requestResult,
  transactionDone,
} from './open-database.js'

/**
 * Reads every inspection saved on this device, newest change first. Each
 * one is checked as it's read, so a save from an older version can't break
 * the app.
 *
 * @returns {Promise<Inspection[]>} The inspections.
 */
async function listInspections(): Promise<Inspection[]> {
  const database = await openDatabase()
  const saved = await requestResult(
    database.transaction(INSPECTIONS).objectStore(INSPECTIONS).getAll(),
  )

  return (saved as JsonValue[])
    .map(value => normalizeInspection(value))
    .filter(inspection => inspection !== undefined)
    .toSorted((first, second) =>
      second.updatedAt.localeCompare(first.updatedAt),
    )
}

/**
 * Reads one inspection.
 *
 * @param {string} id The inspection's id.
 * @returns {Promise<Inspection | undefined>} The inspection, or undefined when it isn't on this device.
 */
async function getInspection(id: string): Promise<Inspection | undefined> {
  const database = await openDatabase()
  const saved = await requestResult(
    database.transaction(INSPECTIONS).objectStore(INSPECTIONS).get(id),
  )

  return normalizeInspection(saved as JsonValue | undefined)
}

/**
 * Saves an inspection, replacing any earlier save of it.
 *
 * @param {Inspection} inspection The inspection.
 * @returns {Promise<void>} Resolves once it's saved.
 */
async function putInspection(inspection: Inspection): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction(INSPECTIONS, 'readwrite')

  transaction.objectStore(INSPECTIONS).put(inspection)
  await transactionDone(transaction)
}

/**
 * Deletes an inspection and every photo stored for it.
 *
 * @param {string} id The inspection's id.
 * @returns {Promise<void>} Resolves once both are gone.
 */
async function deleteInspection(id: string): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction([INSPECTIONS, PHOTOS], 'readwrite')
  const photos = transaction.objectStore(PHOTOS)
  const photoIds = await requestResult(
    photos.index(BY_INSPECTION).getAllKeys(id),
  )

  for (const photoId of photoIds) {
    photos.delete(photoId)
  }

  transaction.objectStore(INSPECTIONS).delete(id)
  await transactionDone(transaction)
}

export { deleteInspection, getInspection, listInspections, putInspection }
