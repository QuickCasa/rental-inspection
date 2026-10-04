import type { Room, RoomProgress } from './types.js'

/**
 * Counts how much of a room is done, for its heading on the page.
 *
 * @param {Room} room The room.
 * @returns {RoomProgress} How many items are rated, out of how many, and how many are poor.
 */
function getRoomProgress(room: Room): RoomProgress {
  return {
    rated: room.items.filter(item => item.condition !== '').length,
    total: room.items.length,
    poor: room.items.filter(item => item.condition === 'poor').length,
  }
}

export { getRoomProgress }
