import { deletePhotos, putPhotos } from './database/photos.js'
import { addPhotoUrl, releasePhotoUrl } from './photo-urls.js'
import { resizePhoto } from './resize-photo.js'
import type { InspectionItem, PhotoRecord } from './types.js'

/**
 * Scales down and stores photos for an item, then adds them to it. Files
 * that aren't photos are skipped and counted.
 *
 * @param {string} inspectionId The inspection's id.
 * @param {InspectionItem} item The item.
 * @param {readonly File[]} files The chosen files.
 * @returns {Promise<number>} How many files couldn't be read as photos.
 */
async function addItemPhotos(
  inspectionId: string,
  item: InspectionItem,
  files: readonly File[],
): Promise<number> {
  const records: PhotoRecord[] = []
  let skipped = 0

  for (const file of files) {
    try {
      const photo = await resizePhoto(file)

      records.push({
        id: crypto.randomUUID(),
        inspectionId,
        ...photo,
        addedAt: new Date().toISOString(),
      })
    } catch {
      skipped += 1
    }
  }

  await putPhotos(records)

  for (const record of records) {
    addPhotoUrl(record.id, record.blob)
    item.photoIds.push(record.id)
  }

  return skipped
}

/**
 * Deletes photos from storage and from the screen.
 *
 * @param {readonly string[]} ids The photos' ids.
 * @returns {Promise<void>} Resolves once they're gone.
 */
async function removePhotos(ids: readonly string[]): Promise<void> {
  await deletePhotos(ids)

  for (const id of ids) {
    releasePhotoUrl(id)
  }
}

export { addItemPhotos, removePhotos }
