import { readBackupText, withNewIds } from './backup-file.js'
import { putInspection } from './database/inspections.js'
import { putPhotos } from './database/photos.js'
import type { Inspection } from './types.js'

/**
 * Opens a backup file and saves its inspection and photos on this device,
 * as a new copy.
 *
 * @param {File} file The backup file.
 * @returns {Promise<Inspection | undefined>} The saved inspection, or undefined when the file isn't a backup this version can read.
 */
async function importBackup(file: File): Promise<Inspection | undefined> {
  const backup = readBackupText(await file.text())

  if (!backup) {
    return undefined
  }

  const { inspection, photos } = withNewIds(backup)

  await putPhotos(
    photos.map(photo => ({
      id: photo.id,
      inspectionId: inspection.id,
      blob: new Blob([new Uint8Array(photo.bytes)], { type: 'image/jpeg' }),
      width: photo.width,
      height: photo.height,
      addedAt: photo.addedAt,
    })),
  )
  await putInspection(inspection)

  return inspection
}

export { importBackup }
