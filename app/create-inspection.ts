import { DEFAULT_ROOMS, ROOM_TEMPLATES } from './constants.js'
import { createRoom } from './create-room.js'
import { getLocalDate, getTimeZone } from './local-time.js'
import type { Inspection, InspectionKind, Room } from './types.js'

/**
 * Makes the rooms a new inspection starts with.
 *
 * @returns {Room[]} The rooms, each with its usual items.
 */
function createDefaultRooms(): Room[] {
  return DEFAULT_ROOMS.map(name => {
    const template = ROOM_TEMPLATES.find(room => room.name === name)
    return createRoom(name, template?.items ?? [])
  })
}

/**
 * Makes a new, blank inspection dated today.
 *
 * @param {InspectionKind} kind Move-in, move-out or routine.
 * @param {Date} now The current time.
 * @returns {Inspection} The inspection.
 */
function createInspection(kind: InspectionKind, now = new Date()): Inspection {
  const timestamp = now.toISOString()

  return {
    id: crypto.randomUUID(),
    kind,
    address: '',
    date: getLocalDate(now),
    landlord: '',
    tenants: '',
    keys: '',
    meters: '',
    notes: '',
    tenantComments: '',
    rooms: createDefaultRooms(),
    signatures: [],
    baseline: null,
    timeZone: getTimeZone(),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export { createInspection }
