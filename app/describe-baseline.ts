import { CONDITION_LABELS } from './constants.js'
import type { ItemBaseline } from './types.js'

/**
 * Ends a sentence with a full stop, unless it already ends with punctuation.
 *
 * @param {string} text The sentence.
 * @returns {string} The sentence, ended.
 */
function endSentence(text: string): string {
  return /[.!?]$/u.test(text) ? text : `${text}.`
}

/**
 * Describes how an item looked in the inspection a move-out is compared
 * with, such as "Fair. Scratch by the window. 2 photos in that report." A
 * rating with nothing else is just the rating, such as "Good".
 *
 * @param {ItemBaseline | null} baseline The earlier rating and notes.
 * @returns {string} The description.
 */
function describeBaseline(baseline: ItemBaseline | null): string {
  if (!baseline) {
    return 'Not in that report'
  }

  const label = CONDITION_LABELS[baseline.condition]
  const notes = baseline.notes.trim()
  const photos =
    baseline.photoCount === 1
      ? '1 photo in that report.'
      : `${String(baseline.photoCount)} photos in that report.`
  const details = [
    notes === '' ? '' : endSentence(notes),
    baseline.photoCount > 0 ? photos : '',
  ].filter(part => part !== '')

  return details.length === 0 ? label : `${label}. ${details.join(' ')}`
}

export { describeBaseline }
