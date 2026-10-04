import {
  BASELINE_PHRASES,
  CONDITION_LABELS,
  KIND_LABELS,
} from '../constants.js'
import { findFlaggedItems } from '../find-flagged-items.js'
import { formatDate } from '../format-date.js'
import { formatTimestamp } from '../format-timestamp.js'
import { getInspectionTitle } from '../inspection-names.js'
import { splitLines } from '../split-lines.js'
import type { Inspection } from '../types.js'
import type { PdfWriter } from './pdf-writer.js'

/**
 * Writes the report's title and the facts about the inspection: where, when,
 * who, keys, meters and when the report was made. Blank facts are left out.
 *
 * @param {PdfWriter} writer The writer.
 * @param {Inspection} inspection The inspection.
 * @param {Date} now When the report is being made.
 */
function writeDetails(
  writer: PdfWriter,
  inspection: Inspection,
  now: Date,
): void {
  const { baseline } = inspection
  const tenants = splitLines(inspection.tenants)
  const items = inspection.rooms.flatMap(room => room.items)
  const rated = items.filter(item => item.condition !== '').length
  const phrase = baseline ? BASELINE_PHRASES[baseline.kind] : ''
  const facts: [string, string][] = [
    ['Address', inspection.address.trim()],
    ['Inspection date', formatDate(inspection.date.trim())],
    ['Landlord or company', inspection.landlord.trim()],
    [tenants.length > 1 ? 'Tenants' : 'Tenant', tenants.join(', ')],
    [
      'Compared with',
      baseline
        ? `The ${KIND_LABELS[baseline.kind].toLowerCase()} inspection of ${formatDate(baseline.date)}`
        : '',
    ],
    [`Keys at ${phrase}`, baseline?.keys.trim() ?? ''],
    [baseline ? 'Keys now' : 'Keys', inspection.keys.trim()],
    ['Meter readings', inspection.meters.trim()],
    ['Items rated', `${String(rated)} of ${String(items.length)}`],
    ['Report made', formatTimestamp(now.toISOString(), inspection.timeZone)],
  ]

  writer.text(`${getInspectionTitle(inspection)} report`, {
    size: 22,
    bold: true,
  })
  writer.space(10)

  for (const [label, value] of facts) {
    if (value !== '') {
      writer.fact(label, value)
    }
  }
}

/**
 * Lists the items that need a look before anything else: for a move-out,
 * everything rated worse than at move-in, and otherwise everything rated
 * poor.
 *
 * @param {PdfWriter} writer The writer.
 * @param {Inspection} inspection The inspection.
 */
function writeFlaggedItems(writer: PdfWriter, inspection: Inspection): void {
  const { baseline } = inspection
  const flagged = findFlaggedItems(inspection)
  const phrase = baseline ? BASELINE_PHRASES[baseline.kind] : ''

  if (baseline) {
    writer.heading(`Changes since ${phrase}`)

    if (flagged.length === 0) {
      writer.text(`No item is rated worse than at ${phrase}.`)
    }
  } else if (flagged.length > 0) {
    writer.heading('Items rated poor')
  }

  for (const entry of flagged) {
    const change = baseline
      ? `${CONDITION_LABELS[entry.before]} at ${phrase}, ${CONDITION_LABELS[entry.after].toLowerCase()} now.`
      : ''

    writer.text(
      `${entry.room || 'Unnamed room'}: ${entry.item || 'Unnamed item'}`,
      { bold: true },
    )

    const detail = [change, entry.notes].filter(part => part !== '').join(' ')

    if (detail !== '') {
      writer.text(detail)
    }

    writer.space(4)
  }
}

export { writeDetails, writeFlaggedItems }
