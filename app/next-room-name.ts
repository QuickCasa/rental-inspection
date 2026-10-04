import type { Room } from './types.js'

/**
 * Names a new room so it doesn't repeat one already there: a second bedroom
 * becomes "Bedroom 2".
 *
 * @param {readonly Room[]} rooms The rooms so far.
 * @param {string} name The room's usual name.
 * @returns {string} The name to use.
 */
function nextRoomName(rooms: readonly Room[], name: string): string {
  const taken = new Set(rooms.map(room => room.name.trim().toLowerCase()))

  if (!taken.has(name.toLowerCase())) {
    return name
  }

  let number = 2

  while (taken.has(`${name} ${String(number)}`.toLowerCase())) {
    number += 1
  }

  return `${name} ${String(number)}`
}

export { nextRoomName }
