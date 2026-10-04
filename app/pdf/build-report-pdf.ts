import type { jsPDF as JsPdf } from 'jspdf'
import { SITE_ADDRESS } from '../constants.js'
import { getInspectionTitle } from '../inspection-names.js'
import { numberPhotos } from '../number-photos.js'
import type { Inspection, PhotoMap } from '../types.js'
import { PdfWriter } from './pdf-writer.js'
import { writeDetails, writeFlaggedItems } from './write-details.js'
import { writePhotos } from './write-photos.js'
import { writeRooms } from './write-rooms.js'
import { writeSignatures } from './write-signatures.js'

const FOOTER_ADDRESS_LENGTH = 60

/**
 * Writes a section of free text, if there's any.
 *
 * @param {PdfWriter} writer The writer.
 * @param {string} heading The section heading.
 * @param {string} text The text.
 */
function writeTextSection(
  writer: PdfWriter,
  heading: string,
  text: string,
): void {
  if (text.trim() === '') {
    return
  }

  writer.heading(heading)
  writer.text(text.trim())
}

/**
 * Builds the inspection report: the facts, anything that needs a look, a
 * checklist for each room, notes, signatures and then every photo, numbered
 * to match the checklist.
 *
 * @param {Inspection} inspection The inspection.
 * @param {PhotoMap} photos Its photos, by id.
 * @param {typeof JsPdf} JsPdfConstructor The jsPDF class, loaded when it's needed.
 * @param {Date} now When the report is being made.
 * @returns {JsPdf} The document, ready to save.
 */
function buildReportPdf(
  inspection: Inspection,
  photos: PhotoMap,
  JsPdfConstructor: typeof JsPdf,
  now = new Date(),
): JsPdf {
  const pdf = new JsPdfConstructor({ unit: 'pt', format: 'letter' })
  const writer = new PdfWriter(pdf)
  const title = `${getInspectionTitle(inspection)} report`
  const address = inspection.address.trim()
  const numbered = numberPhotos(inspection, photos)
  const photoNumbers = new Map<string, number[]>()

  for (const entry of numbered) {
    photoNumbers.set(entry.itemId, [
      ...(photoNumbers.get(entry.itemId) ?? []),
      entry.number,
    ])
  }

  pdf.setProperties({
    title: address === '' ? title : `${title}, ${address}`,
    creator: `QuickCasa rental inspection app, ${SITE_ADDRESS}`,
  })

  writeDetails(writer, inspection, now)
  writeFlaggedItems(writer, inspection)
  writeRooms(writer, inspection, photoNumbers)
  writeTextSection(writer, 'Notes', inspection.notes)
  writeTextSection(
    writer,
    'Comments from the tenant',
    inspection.tenantComments,
  )
  writeSignatures(writer, inspection)
  writer.space(12)
  writer.text(`Made with the free rental inspection app at ${SITE_ADDRESS}.`, {
    size: 9,
    muted: true,
  })
  writePhotos(writer, numbered, inspection.timeZone)

  const shortAddress =
    address.length > FOOTER_ADDRESS_LENGTH
      ? `${address.slice(0, FOOTER_ADDRESS_LENGTH).trim()}...`
      : address

  writer.footer(address === '' ? `${title}. ` : `${title}, ${shortAddress}. `)

  return pdf
}

export { buildReportPdf }
