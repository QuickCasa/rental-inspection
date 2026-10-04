import { BASELINE_PHRASES, CONDITION_LABELS } from '../constants.js'
import { describeBaseline } from '../describe-baseline.js'
import { isWorse } from '../is-worse.js'
import type { Inspection, InspectionItem, PdfCell } from '../types.js'
import type { PdfWriter } from './pdf-writer.js'

const HEADER_SIZE = 8.5

/**
 * Describes photo numbers for the checklist, such as "Photos 3, 4".
 *
 * @param {readonly number[]} numbers The photo numbers.
 * @returns {string} The description, or an empty string for no photos.
 */
function describePhotos(numbers: readonly number[]): string {
  if (numbers.length === 0) {
    return ''
  }

  const label = numbers.length === 1 ? 'Photo' : 'Photos'
  return `${label} ${numbers.join(', ')}`
}

/**
 * Builds the cells for one item's row.
 *
 * @param {InspectionItem} item The item.
 * @param {readonly number[]} widths The column widths.
 * @param {boolean} compare Whether the report compares with an earlier inspection.
 * @param {readonly number[]} photoNumbers The item's photo numbers.
 * @returns {PdfCell[]} The cells.
 */
function itemCells(
  item: InspectionItem,
  widths: readonly number[],
  compare: boolean,
  photoNumbers: readonly number[],
): PdfCell[] {
  const [nameWidth = 0, ...rest] = widths
  const notes = [item.notes.trim(), describePhotos(photoNumbers)]
    .filter(part => part !== '')
    .join('\n')
  const worse = isWorse(item.baseline?.condition ?? '', item.condition)
  const condition = `${CONDITION_LABELS[item.condition]}${worse ? ', worse' : ''}`
  const cells: PdfCell[] = [
    { text: item.name.trim() || 'Unnamed item', width: nameWidth, bold: true },
  ]

  if (compare) {
    cells.push({
      text: describeBaseline(item.baseline),
      width: rest[0] ?? 0,
      muted: true,
    })
  }

  const [conditionWidth = 0, notesWidth = 0] = compare ? rest.slice(1) : rest

  cells.push(
    {
      text: condition,
      width: conditionWidth,
      bold: worse,
      muted: item.condition === '',
    },
    { text: notes, width: notesWidth },
  )

  return cells
}

/**
 * Writes a checklist table for each room: every item with its rating, notes
 * and photo numbers. A report compared with a move-in also shows each item's
 * move-in rating, and marks the ones that got worse.
 *
 * @param {PdfWriter} writer The writer.
 * @param {Inspection} inspection The inspection.
 * @param {ReadonlyMap<string, number[]>} photoNumbers Each item's photo numbers, by item id.
 */
function writeRooms(
  writer: PdfWriter,
  inspection: Inspection,
  photoNumbers: ReadonlyMap<string, number[]>,
): void {
  const { baseline } = inspection
  const compare = baseline !== null
  const widths = compare
    ? [130, 130, 70, writer.width - 330]
    : [160, 80, writer.width - 240]
  const headings = compare
    ? ['Item', `At ${BASELINE_PHRASES[baseline.kind]}`, 'Now', 'Notes']
    : ['Item', 'Condition', 'Notes']

  const headerCells = headings.map((text, index) => ({
    text,
    width: widths[index] ?? 0,
    bold: true,
    muted: true,
  }))

  for (const room of inspection.rooms) {
    const name = room.name.trim() || 'Unnamed room'

    writer.heading(name, 13)

    if (room.items.length === 0) {
      writer.text('No items listed.', { muted: true })
      continue
    }

    writer.row(headerCells, HEADER_SIZE)

    for (const item of room.items) {
      const cells = itemCells(
        item,
        widths,
        compare,
        photoNumbers.get(item.id) ?? [],
      )

      // A room that carries on over a page break gets its name and column
      // headings again, so every page reads on its own.
      if (!writer.fits(writer.measureRow(cells))) {
        writer.newPage()
        writer.text(`${name}, continued`, { size: 11, bold: true })
        writer.space(4)
        writer.row(headerCells, HEADER_SIZE)
      }

      writer.row(cells)
    }
  }
}

export { writeRooms }
