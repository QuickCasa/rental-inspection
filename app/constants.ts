import type { Condition, InspectionKind, RoomTemplate } from './types.js'

const DATABASE_NAME = 'quickcasa-rental-inspection'
const DATABASE_VERSION = 1

/**
 * Photos are scaled down to fit this many pixels on their longest side:
 * enough to show a scratch or a stain in the PDF, small enough that a
 * hundred photos fit in the browser's storage.
 */
const PHOTO_MAX_SIZE = 1600
const PHOTO_QUALITY = 0.8

/**
 * Backup files carry this name and version, so the app can tell its own
 * files apart and read older ones after the format changes.
 */
const BACKUP_FORMAT = 'quickcasa-rental-inspection'
const BACKUP_VERSION = 1

const SITE_ADDRESS = 'quickcasa.github.io/rental-inspection'

const KINDS: readonly InspectionKind[] = ['move-in', 'move-out', 'routine']

const KIND_LABELS: Readonly<Record<InspectionKind, string>> = {
  'move-in': 'Move-in',
  'move-out': 'Move-out',
  routine: 'Routine',
}

/**
 * How the report refers to the inspection a move-out is compared with, as in
 * "Changes since move-in".
 */
const BASELINE_PHRASES: Readonly<Record<InspectionKind, string>> = {
  'move-in': 'move-in',
  'move-out': 'move-out',
  routine: 'the last inspection',
}

/**
 * The ratings someone can choose, in the order they're shown.
 */
const CONDITIONS: readonly Exclude<Condition, ''>[] = [
  'good',
  'fair',
  'poor',
  'not-applicable',
]

const CONDITION_LABELS: Readonly<Record<Condition, string>> = {
  '': 'Not rated',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  'not-applicable': 'N/A',
}

/**
 * How bad each rating is, to tell whether an item got worse since move-in.
 * Items that aren't rated, or don't apply, can't get worse.
 */
const CONDITION_RANKS: Readonly<Partial<Record<Condition, number>>> = {
  good: 1,
  fair: 2,
  poor: 3,
}

const WALLS_CEILING_FLOOR = ['Walls', 'Ceiling', 'Floor'] as const

const ROOM_TEMPLATES: readonly RoomTemplate[] = [
  {
    name: 'Entrance and hallways',
    items: [
      'Front door and lock',
      ...WALLS_CEILING_FLOOR,
      'Closet',
      'Lights and switches',
    ],
  },
  {
    name: 'Living room',
    items: [
      ...WALLS_CEILING_FLOOR,
      'Windows and screens',
      'Window coverings',
      'Lights and switches',
      'Outlets',
    ],
  },
  {
    name: 'Dining room',
    items: [
      ...WALLS_CEILING_FLOOR,
      'Windows and screens',
      'Window coverings',
      'Lights and switches',
      'Outlets',
    ],
  },
  {
    name: 'Kitchen',
    items: [
      ...WALLS_CEILING_FLOOR,
      'Cabinets and drawers',
      'Countertops',
      'Sink and taps',
      'Fridge',
      'Stove and oven',
      'Range hood',
      'Dishwasher',
      'Windows and screens',
      'Lights and switches',
      'Outlets',
    ],
  },
  {
    name: 'Bedroom',
    items: [
      'Door',
      ...WALLS_CEILING_FLOOR,
      'Closet',
      'Windows and screens',
      'Window coverings',
      'Lights and switches',
      'Outlets',
    ],
  },
  {
    name: 'Bathroom',
    items: [
      'Door',
      ...WALLS_CEILING_FLOOR,
      'Toilet',
      'Sink and taps',
      'Bathtub or shower',
      'Tiles and caulking',
      'Mirror and cabinet',
      'Exhaust fan',
      'Lights and switches',
    ],
  },
  {
    name: 'Laundry',
    items: ['Washer', 'Dryer', 'Taps and drain', 'Walls', 'Floor'],
  },
  {
    name: 'Basement',
    items: [
      'Stairs and railings',
      ...WALLS_CEILING_FLOOR,
      'Lights and switches',
      'Dampness or leaks',
    ],
  },
  {
    name: 'Balcony or patio',
    items: ['Door', 'Floor or deck', 'Railings', 'Lights'],
  },
  {
    name: 'Garage or parking',
    items: ['Door and opener', 'Walls', 'Floor', 'Lights'],
  },
  {
    name: 'Outside and yard',
    items: [
      'Lawn and garden',
      'Fences and gates',
      'Driveway and walkways',
      'Siding and trim',
      'Eavestroughs',
    ],
  },
  {
    name: 'Heating and cooling',
    items: [
      'Thermostat',
      'Furnace or heaters',
      'Air conditioning',
      'Vents and filters',
    ],
  },
  {
    name: 'Safety',
    items: ['Smoke alarms', 'Carbon monoxide alarms', 'Fire extinguisher'],
  },
  {
    name: 'Other room',
    items: [...WALLS_CEILING_FLOOR, 'Lights and switches'],
  },
]

/**
 * The rooms a new inspection starts with. More can be added, and any can be
 * removed.
 */
const DEFAULT_ROOMS: readonly string[] = [
  'Entrance and hallways',
  'Living room',
  'Kitchen',
  'Bedroom',
  'Bathroom',
  'Safety',
]

export {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  BASELINE_PHRASES,
  CONDITION_LABELS,
  CONDITION_RANKS,
  CONDITIONS,
  DATABASE_NAME,
  DATABASE_VERSION,
  DEFAULT_ROOMS,
  KIND_LABELS,
  KINDS,
  PHOTO_MAX_SIZE,
  PHOTO_QUALITY,
  ROOM_TEMPLATES,
  SITE_ADDRESS,
}
