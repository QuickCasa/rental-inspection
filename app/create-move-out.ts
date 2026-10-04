import { createInspection } from './create-inspection.js'
import type { Inspection } from './types.js'

/**
 * Starts a move-out inspection from a move-in one. It keeps the address,
 * people and rooms, and each item remembers its move-in rating and notes so
 * the two can be compared. Ratings, notes, photos and signatures start
 * blank.
 *
 * @param {Inspection} source The move-in inspection.
 * @param {Date} now The current time.
 * @returns {Inspection} The new move-out inspection.
 */
function createMoveOut(source: Inspection, now = new Date()): Inspection {
  const inspection = createInspection('move-out', now)

  return {
    ...inspection,
    address: source.address,
    landlord: source.landlord,
    tenants: source.tenants,
    rooms: source.rooms.map(room => ({
      id: crypto.randomUUID(),
      name: room.name,
      items: room.items.map(item => ({
        id: crypto.randomUUID(),
        name: item.name,
        condition: '',
        notes: '',
        photoIds: [],
        baseline: {
          condition: item.condition,
          notes: item.notes,
          photoCount: item.photoIds.length,
        },
      })),
    })),
    baseline: {
      id: source.id,
      kind: source.kind,
      date: source.date,
      keys: source.keys,
    },
  }
}

export { createMoveOut }
