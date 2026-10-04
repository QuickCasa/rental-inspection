import type { InspectionItem, Room } from './types.js'

/**
 * Makes a blank, unrated item with a fresh id.
 *
 * @param {string} name What the item is, such as "Walls".
 * @returns {InspectionItem} The item.
 */
function createItem(name: string): InspectionItem {
  return {
    id: crypto.randomUUID(),
    name,
    condition: '',
    notes: '',
    photoIds: [],
    baseline: null,
  }
}

/**
 * Makes a room with a fresh id and an unrated item for each name.
 *
 * @param {string} name The room's name, such as "Kitchen".
 * @param {readonly string[]} itemNames The items it starts with.
 * @returns {Room} The room.
 */
function createRoom(name: string, itemNames: readonly string[]): Room {
  return {
    id: crypto.randomUUID(),
    name,
    items: itemNames.map(itemName => createItem(itemName)),
  }
}

export { createItem, createRoom }
