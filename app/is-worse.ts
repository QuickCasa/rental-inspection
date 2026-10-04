import { CONDITION_RANKS } from './constants.js'
import type { Condition } from './types.js'

/**
 * Tells whether an item's rating is worse than it was, such as fair at
 * move-in and poor now. Unrated items, and items that don't apply, are never
 * worse.
 *
 * @param {Condition} before The earlier rating.
 * @param {Condition} after The new rating.
 * @returns {boolean} Whether the new rating is worse.
 */
function isWorse(before: Condition, after: Condition): boolean {
  const beforeRank = CONDITION_RANKS[before]
  const afterRank = CONDITION_RANKS[after]

  return (
    beforeRank !== undefined &&
    afterRank !== undefined &&
    afterRank > beforeRank
  )
}

export { isWorse }
