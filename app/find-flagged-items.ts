import { isWorse } from './is-worse.js'
import type { FlaggedItem, Inspection } from './types.js'

/**
 * Finds the items worth calling out at the top of the report. For an
 * inspection compared with a move-in, that's every item rated worse than it
 * was then. Otherwise it's every item rated poor.
 *
 * @param {Inspection} inspection The inspection.
 * @returns {FlaggedItem[]} The items, in the order they appear in the report.
 */
function findFlaggedItems(inspection: Inspection): FlaggedItem[] {
  const flagged: FlaggedItem[] = []

  for (const room of inspection.rooms) {
    for (const item of room.items) {
      const before = item.baseline?.condition ?? ''
      const include =
        inspection.baseline === null
          ? item.condition === 'poor'
          : isWorse(before, item.condition)

      if (include) {
        flagged.push({
          room: room.name.trim(),
          item: item.name.trim(),
          before,
          after: item.condition,
          notes: item.notes.trim(),
        })
      }
    }
  }

  return flagged
}

export { findFlaggedItems }
