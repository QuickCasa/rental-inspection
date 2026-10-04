import { formatTimestamp } from '../format-timestamp.js'
import type { NumberedPhoto } from '../types.js'
import type { PdfWriter } from './pdf-writer.js'

const COLUMNS = 2
const GAP = 18
const PHOTO_HEIGHT = 190
const CAPTION_SIZE = 9
const CAPTION_SPACE = 44

/**
 * Writes a photo's caption: its number, room and item, and when it was added.
 *
 * @param {PdfWriter} writer The writer.
 * @param {NumberedPhoto} entry The photo.
 * @param {string} timeZone The inspection's time zone.
 * @param {number} x The caption's left edge.
 * @param {number} width The caption's width.
 */
function writeCaption(
  writer: PdfWriter,
  entry: NumberedPhoto,
  timeZone: string,
  x: number,
  width: number,
): void {
  const where = [entry.room || 'Unnamed room', entry.item || 'Unnamed item']
  const added =
    entry.photo.addedAt === ''
      ? ''
      : ` Added ${formatTimestamp(entry.photo.addedAt, timeZone)}.`

  writer.text(`Photo ${String(entry.number)}. ${where.join(', ')}.`, {
    size: CAPTION_SIZE,
    bold: true,
    x,
    width,
  })
  writer.text(added.trim(), { size: CAPTION_SIZE, muted: true, x, width })
}

/**
 * Writes every photo, two to a row, starting on a new page. Each one is
 * numbered to match the checklist, with when it was added to the
 * inspection.
 *
 * @param {PdfWriter} writer The writer.
 * @param {readonly NumberedPhoto[]} photos The photos, in order.
 * @param {string} timeZone The inspection's time zone.
 */
function writePhotos(
  writer: PdfWriter,
  photos: readonly NumberedPhoto[],
  timeZone: string,
): void {
  if (photos.length === 0) {
    return
  }

  const columnWidth = (writer.width - GAP * (COLUMNS - 1)) / COLUMNS

  writer.newPage()
  writer.text('Photos', { size: 14, bold: true })
  writer.space(10)

  for (let start = 0; start < photos.length; start += COLUMNS) {
    writer.ensureSpace(PHOTO_HEIGHT + CAPTION_SPACE)

    const top = writer.y
    const captionTop = top + PHOTO_HEIGHT + 6
    const row = photos.slice(start, start + COLUMNS)
    let bottom = captionTop

    for (const [column, entry] of row.entries()) {
      const x = writer.left + column * (columnWidth + GAP)

      writer.image(entry.photo.bytes, 'JPEG', {
        x,
        y: top,
        width: columnWidth,
        height: PHOTO_HEIGHT,
      })
      writer.setCursor(captionTop)
      writeCaption(writer, entry, timeZone, x, columnWidth)
      bottom = Math.max(bottom, writer.y)
    }

    writer.setCursor(bottom + 18)
  }
}

export { writePhotos }
