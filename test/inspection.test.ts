import { describe, expect, it } from 'vitest'
import { DEFAULT_ROOMS } from '../app/constants.js'
import { createInspection } from '../app/create-inspection.js'
import { createMoveOut } from '../app/create-move-out.js'
import { describeBaseline } from '../app/describe-baseline.js'
import { findFlaggedItems } from '../app/find-flagged-items.js'
import { getRoomProgress } from '../app/get-room-progress.js'
import { getSigners } from '../app/get-signers.js'
import { getInspectionFileName } from '../app/inspection-names.js'
import { nextRoomName } from '../app/next-room-name.js'
import { normalizeInspection } from '../app/normalize-inspection.js'
import type { JsonValue } from '../app/types.js'
import {
  createFilledInspection,
  createTestSignature,
} from './fixtures/create-filled-inspection.js'

describe('createInspection', () => {
  it('starts with the default rooms, each with its usual items, all unrated', () => {
    const inspection = createInspection('move-in')

    expect(inspection.rooms.map(room => room.name)).toEqual(DEFAULT_ROOMS)
    expect(inspection.rooms.every(room => room.items.length > 0)).toBe(true)
    expect(
      inspection.rooms.flatMap(room => room.items).map(item => item.condition),
    ).not.toContain('good')
    expect(inspection.date).toMatch(/^\d{4}-\d{2}-\d{2}$/u)
  })
})

describe('createMoveOut', () => {
  it('keeps the people and rooms, and remembers each move-in rating', () => {
    const moveIn = createFilledInspection()
    const moveOut = createMoveOut(moveIn, new Date('2027-09-30T15:00:00Z'))
    const [kitchen] = moveOut.rooms
    const [countertops] = kitchen?.items ?? []

    expect(moveOut.kind).toBe('move-out')
    expect(moveOut.id).not.toBe(moveIn.id)
    expect(moveOut.address).toBe(moveIn.address)
    expect(moveOut.tenants).toBe(moveIn.tenants)
    expect(moveOut.baseline).toEqual({
      id: moveIn.id,
      kind: 'move-in',
      date: '2026-10-03',
      keys: '2 door keys, 1 mailbox key',
    })
    expect(kitchen?.id).not.toBe(moveIn.rooms[0]?.id)
    expect(countertops).toMatchObject({
      name: 'Countertops',
      condition: '',
      notes: '',
      photoIds: [],
      baseline: {
        condition: 'fair',
        notes: 'Small scratch left of the sink.',
        photoCount: 1,
      },
    })
    expect(moveOut.keys).toBe('')
    expect(moveOut.signatures).toEqual([])
  })
})

describe('describeBaseline', () => {
  it('describes the earlier rating, notes and photos as sentences', () => {
    expect(
      describeBaseline({
        condition: 'fair',
        notes: 'Scratch by the window',
        photoCount: 2,
      }),
    ).toBe('Fair. Scratch by the window. 2 photos in that report.')
    expect(
      describeBaseline({ condition: 'good', notes: '', photoCount: 0 }),
    ).toBe('Good')
    expect(
      describeBaseline({ condition: '', notes: 'Check it!', photoCount: 1 }),
    ).toBe('Not rated. Check it! 1 photo in that report.')
    expect(describeBaseline(null)).toBe('Not in that report')
  })
})

describe('findFlaggedItems', () => {
  it('lists items rated worse than at move-in, and nothing else', () => {
    const moveOut = createMoveOut(createFilledInspection())
    const [countertops, fridge] = moveOut.rooms[0]?.items ?? []
    const [toilet] = moveOut.rooms[1]?.items ?? []

    if (!countertops || !fridge || !toilet) {
      throw new Error('The test inspection is missing items.')
    }

    countertops.condition = 'poor'
    countertops.notes = 'Burn mark by the stove.'
    fridge.condition = 'good'
    toilet.condition = 'poor'

    expect(findFlaggedItems(moveOut)).toEqual([
      {
        room: 'Kitchen',
        item: 'Countertops',
        before: 'fair',
        after: 'poor',
        notes: 'Burn mark by the stove.',
      },
    ])
  })

  it('lists items rated poor when there is nothing to compare with', () => {
    const inspection = createFilledInspection()
    const [, fridge] = inspection.rooms[0]?.items ?? []

    if (!fridge) {
      throw new Error('The test inspection is missing items.')
    }

    fridge.condition = 'poor'

    expect(findFlaggedItems(inspection).map(entry => entry.item)).toEqual([
      'Fridge',
    ])
  })
})

describe('getSigners', () => {
  it('lists the landlord, then each tenant on their own line', () => {
    const signers = getSigners(createFilledInspection())

    expect(signers).toEqual([
      { slot: 'landlord', role: 'landlord', name: 'Maple Court Properties' },
      { slot: 'tenant-0', role: 'tenant', name: 'Jordan Lee' },
      { slot: 'tenant-1', role: 'tenant', name: 'Sam Rivera' },
    ])
  })

  it('keeps a tenant line when no tenants are listed', () => {
    const inspection = createInspection('routine')

    expect(getSigners(inspection).map(signer => signer.slot)).toEqual([
      'landlord',
      'tenant-0',
    ])
  })
})

describe('getRoomProgress', () => {
  it('counts rated and poor items', () => {
    const [kitchen] = createFilledInspection().rooms

    if (!kitchen) {
      throw new Error('The test inspection is missing its kitchen.')
    }

    kitchen.items.push({ ...kitchen.items[0]!, id: 'x', condition: 'poor' })

    expect(getRoomProgress(kitchen)).toEqual({ rated: 3, total: 3, poor: 1 })
  })
})

describe('nextRoomName', () => {
  it('numbers a room whose name is taken', () => {
    const rooms = createInspection('move-in').rooms

    expect(nextRoomName(rooms, 'Laundry')).toBe('Laundry')
    expect(nextRoomName(rooms, 'Bedroom')).toBe('Bedroom 2')

    rooms.push({ id: 'x', name: 'bedroom 2', items: [] })

    expect(nextRoomName(rooms, 'Bedroom')).toBe('Bedroom 3')
  })
})

describe('getInspectionFileName', () => {
  it('names files by type, address and date', () => {
    expect(getInspectionFileName(createFilledInspection(), 'pdf')).toBe(
      'move-in-inspection-12-maple-court-unit-4-kitchener-on-2026-10-03.pdf',
    )
  })
})

describe('normalizeInspection', () => {
  it('rejects anything without an id', () => {
    expect(normalizeInspection(undefined)).toBeUndefined()
    expect(normalizeInspection({ address: 'No id' })).toBeUndefined()
  })

  it('round-trips a saved inspection unchanged', () => {
    const inspection = {
      ...createFilledInspection(),
      signatures: [createTestSignature({})],
    }
    const text = JSON.stringify(inspection)
    const saved = JSON.parse(text) as JsonValue

    expect(normalizeInspection(saved)).toEqual(inspection)
  })

  it('keeps good fields and drops tampered ones', () => {
    // The text of an edited file, read back the way the app reads one.
    const text = JSON.stringify({
      id: 'abc',
      kind: 'demolition',
      address: 42,
      timeZone: 'Mars/Olympus_Mons',
      rooms: [
        {
          id: 'room',
          name: 'Kitchen',
          items: [
            {
              id: 'same',
              name: 'Sink',
              condition: 'sparkling',
              photoIds: ['p', 7],
            },
            { id: 'same', name: 'Fridge', condition: 'poor' },
          ],
        },
      ],
      signatures: [
        createTestSignature({ slot: 'tenant-0' }),
        createTestSignature({ slot: 'tenant-0', name: 'Second try' }),
        {
          ...createTestSignature({ slot: 'tenant-1' }),
          image: 'data:image/svg+xml;base64,PHN2Zz4=',
        },
        {
          ...createTestSignature({ slot: 'tenant-2' }),
          signedAt: 'whenever',
        },
      ],
    })
    const saved = JSON.parse(text) as JsonValue

    const inspection = normalizeInspection(saved)
    const [sink, fridge] = inspection?.rooms[0]?.items ?? []

    expect(inspection?.kind).toBe('move-in')
    expect(inspection?.address).toBe('')
    expect(inspection?.timeZone).toBe('UTC')
    expect(sink?.condition).toBe('')
    expect(sink?.photoIds).toEqual(['p'])
    expect(fridge?.condition).toBe('poor')
    expect(fridge?.id).not.toBe(sink?.id)
    expect(inspection?.signatures.map(signature => signature.name)).toEqual([
      'Priya Shah',
    ])
  })
})
