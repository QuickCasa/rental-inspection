import { KIND_LABELS } from './constants.js'
import { toFileName } from './to-file-name.js'
import type { Inspection } from './types.js'

/**
 * Names an inspection by its type, such as "Move-in inspection".
 *
 * @param {Inspection} inspection The inspection.
 * @returns {string} The title.
 */
function getInspectionTitle(inspection: Inspection): string {
  return `${KIND_LABELS[inspection.kind]} inspection`
}

/**
 * Names a file for an inspection from its type, address and date.
 *
 * @param {Inspection} inspection The inspection.
 * @param {string} extension The extension, such as "pdf".
 * @returns {string} Such as "move-in-inspection-12-maple-court-2026-10-03.pdf".
 */
function getInspectionFileName(
  inspection: Inspection,
  extension: string,
): string {
  return toFileName(
    [getInspectionTitle(inspection), inspection.address, inspection.date],
    extension,
  )
}

export { getInspectionFileName, getInspectionTitle }
