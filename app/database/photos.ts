import type { PhotoData, PhotoRecord } from '../types.js'
import {
  BY_INSPECTION,
  openDatabase,
  PHOTOS,
  requestResult,
  transactionDone,
} from './open-database.js'

/**
 * Checks that something read from the photo store is a photo this app saved.
 *
 * @param {PhotoRecord | undefined} value The stored value.
 * @returns {boolean} Whether it's a usable photo.
 */
function isPhotoRecord(value: PhotoRecord | undefined): value is PhotoRecord {
  return (
    value !== undefined &&
    typeof value.id === 'string' &&
    value.blob instanceof Blob &&
    value.width > 0 &&
    value.height > 0
  )
}

/**
 * Saves photos.
 *
 * @param {readonly PhotoRecord[]} records The photos.
 * @returns {Promise<void>} Resolves once they're all saved.
 */
async function putPhotos(records: readonly PhotoRecord[]): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction(PHOTOS, 'readwrite')
  const store = transaction.objectStore(PHOTOS)

  for (const record of records) {
    store.put(record)
  }

  await transactionDone(transaction)
}

/**
 * Reads photos by id. Missing ones are skipped.
 *
 * @param {readonly string[]} ids The photos' ids.
 * @returns {Promise<PhotoRecord[]>} The photos that were found, in the same order.
 */
async function getPhotos(ids: readonly string[]): Promise<PhotoRecord[]> {
  const database = await openDatabase()
  const store = database.transaction(PHOTOS).objectStore(PHOTOS)
  const found = await Promise.all(
    ids.map(
      id => requestResult(store.get(id)) as Promise<PhotoRecord | undefined>,
    ),
  )

  return found.filter(record => isPhotoRecord(record))
}

/**
 * Reads every photo stored for an inspection.
 *
 * @param {string} inspectionId The inspection's id.
 * @returns {Promise<PhotoRecord[]>} The photos.
 */
async function getInspectionPhotos(
  inspectionId: string,
): Promise<PhotoRecord[]> {
  const database = await openDatabase()
  const found = (await requestResult(
    database
      .transaction(PHOTOS)
      .objectStore(PHOTOS)
      .index(BY_INSPECTION)
      .getAll(inspectionId),
  )) as (PhotoRecord | undefined)[]

  return found.filter(record => isPhotoRecord(record))
}

/**
 * Deletes photos by id.
 *
 * @param {readonly string[]} ids The photos' ids.
 * @returns {Promise<void>} Resolves once they're gone.
 */
async function deletePhotos(ids: readonly string[]): Promise<void> {
  if (ids.length === 0) {
    return
  }

  const database = await openDatabase()
  const transaction = database.transaction(PHOTOS, 'readwrite')
  const store = transaction.objectStore(PHOTOS)

  for (const id of ids) {
    store.delete(id)
  }

  await transactionDone(transaction)
}

/**
 * Reads photos as bytes, for a PDF or a backup file.
 *
 * @param {readonly string[]} ids The photos' ids.
 * @returns {Promise<PhotoData[]>} The photos that were found.
 */
async function loadPhotoData(ids: readonly string[]): Promise<PhotoData[]> {
  const records = await getPhotos(ids)

  return Promise.all(
    records.map(async record => ({
      id: record.id,
      bytes: new Uint8Array(await record.blob.arrayBuffer()),
      width: record.width,
      height: record.height,
      addedAt: record.addedAt,
    })),
  )
}

export {
  deletePhotos,
  getInspectionPhotos,
  getPhotos,
  loadPhotoData,
  putPhotos,
}
