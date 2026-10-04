import { readFileSync } from 'node:fs'
import { createInspection } from '../../app/create-inspection.js'
import { createItem, createRoom } from '../../app/create-room.js'
import type { Inspection, PhotoData, Signature } from '../../app/types.js'

const PHOTO = new Uint8Array(
  readFileSync(new URL('photo.jpg', import.meta.url)),
)
const SIGNATURE = `data:image/png;base64,${readFileSync(
  new URL('signature.png', import.meta.url),
).toString('base64')}`

/**
 * Makes a photo record from the test JPEG, which is 64 by 48 pixels.
 *
 * @param {string} id The photo's id.
 * @returns {PhotoData} The photo.
 */
function createTestPhoto(id: string): PhotoData {
  return {
    id,
    bytes: PHOTO,
    width: 64,
    height: 48,
    addedAt: '2026-10-03T18:14:00.000Z',
  }
}

/**
 * Makes a signature drawn with the test PNG.
 *
 * @param {Partial<Signature>} details The details to set.
 * @returns {Signature} The signature.
 */
function createTestSignature(details: Partial<Signature>): Signature {
  return {
    slot: 'landlord',
    role: 'landlord',
    name: 'Priya Shah',
    image: SIGNATURE,
    signedAt: '2026-10-03T18:40:00.000Z',
    ...details,
  }
}

/**
 * Makes a move-in inspection of a two-room unit with ratings, notes and one
 * photo of a scratched counter.
 *
 * @returns {Inspection} The inspection.
 */
function createFilledInspection(): Inspection {
  const inspection = createInspection(
    'move-in',
    new Date('2026-10-03T18:00:00.000Z'),
  )
  const kitchen = createRoom('Kitchen', ['Countertops', 'Fridge'])
  const bathroom = createRoom('Bathroom', ['Toilet'])
  const [countertops, fridge] = kitchen.items

  if (countertops && fridge) {
    countertops.condition = 'fair'
    countertops.notes = 'Small scratch left of the sink.'
    countertops.photoIds = ['photo-1']
    fridge.condition = 'good'
  }

  bathroom.items.push(createItem('Exhaust fan'))

  return {
    ...inspection,
    address: '12 Maple Court, Unit 4, Kitchener, ON',
    date: '2026-10-03',
    landlord: 'Maple Court Properties',
    tenants: 'Jordan Lee\nSam Rivera',
    keys: '2 door keys, 1 mailbox key',
    meters: 'Electricity 04512',
    timeZone: 'America/Toronto',
    rooms: [kitchen, bathroom],
  }
}

export { createFilledInspection, createTestPhoto, createTestSignature }
