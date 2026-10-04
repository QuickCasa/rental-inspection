import { createBackupText } from './backup-file.js'
import { loadPhotoData } from './database/photos.js'
import { buildReportPdf } from './pdf/build-report-pdf.js'
import type { Inspection } from './types.js'

/**
 * Lists the ids of every photo in an inspection.
 *
 * @param {Inspection} inspection The inspection.
 * @returns {string[]} The photo ids.
 */
function listPhotoIds(inspection: Inspection): string[] {
  return inspection.rooms.flatMap(room =>
    room.items.flatMap(item => item.photoIds),
  )
}

/**
 * Builds the PDF report. jsPDF loads only now, so the app itself stays
 * small, and the service worker keeps a copy so this works offline.
 *
 * @param {Inspection} inspection The inspection.
 * @returns {Promise<Blob>} The PDF.
 */
async function buildReportBlob(inspection: Inspection): Promise<Blob> {
  const [{ jsPDF: JsPdfConstructor }, photos] = await Promise.all([
    import('jspdf'),
    loadPhotoData(listPhotoIds(inspection)),
  ])
  const photoMap = new Map(photos.map(photo => [photo.id, photo]))

  return buildReportPdf(inspection, photoMap, JsPdfConstructor).output('blob')
}

/**
 * Builds a backup file with the inspection and all its photos.
 *
 * @param {Inspection} inspection The inspection.
 * @returns {Promise<Blob>} The file.
 */
async function buildBackupBlob(inspection: Inspection): Promise<Blob> {
  const photos = await loadPhotoData(listPhotoIds(inspection))

  return new Blob([createBackupText(inspection, photos)], {
    type: 'application/json',
  })
}

/**
 * Saves a file to the device through the browser's download.
 *
 * @param {Blob} blob The file's contents.
 * @param {string} fileName The name to save it as.
 */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()

  // Some browsers read the file after click() returns, so the URL stays
  // valid for a minute.
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 60_000)
}

export { buildBackupBlob, buildReportBlob, downloadBlob, listPhotoIds }
