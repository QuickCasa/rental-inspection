import { KINDS } from './constants.js'
import { isTimeZone } from './local-time.js'
import {
  asArray,
  asObject,
  readChoice,
  readCount,
  readString,
  readTimestamp,
} from './read-json.js'
import type {
  Baseline,
  Condition,
  Inspection,
  InspectionItem,
  ItemBaseline,
  JsonValue,
  Room,
  Signature,
} from './types.js'

const CONDITION_VALUES: readonly Condition[] = [
  '',
  'good',
  'fair',
  'poor',
  'not-applicable',
]

const SIGNATURE_PREFIX = 'data:image/png;base64,'

/**
 * Hands out ids, replacing any that are missing or already taken, so a
 * damaged or edited file can't give two items the same id.
 */
class IdChecker {
  private readonly seen = new Set<string>()

  /**
   * Returns the id if it's new, or a fresh one.
   *
   * @param {string} id The saved id.
   * @returns {string} An id nothing else uses.
   */
  claim(id: string): string {
    const claimed = id === '' || this.seen.has(id) ? crypto.randomUUID() : id
    this.seen.add(claimed)
    return claimed
  }
}

/**
 * Rebuilds an item's move-in rating and notes.
 *
 * @param {JsonValue | undefined} value The saved baseline.
 * @returns {ItemBaseline | null} The baseline, or null when there isn't one.
 */
function normalizeItemBaseline(
  value: JsonValue | undefined,
): ItemBaseline | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }

  return {
    condition: readChoice(value, 'condition', CONDITION_VALUES),
    notes: readString(value, 'notes'),
    photoCount: readCount(value, 'photoCount'),
  }
}

/**
 * Rebuilds an item, keeping only fields of the right type.
 *
 * @param {JsonValue} value The saved item.
 * @param {IdChecker} ids The ids used so far.
 * @returns {InspectionItem} The item.
 */
function normalizeItem(value: JsonValue, ids: IdChecker): InspectionItem {
  const source = asObject(value)

  return {
    id: ids.claim(readString(source, 'id')),
    name: readString(source, 'name'),
    condition: readChoice(source, 'condition', CONDITION_VALUES),
    notes: readString(source, 'notes'),
    photoIds: asArray(source.photoIds).filter(id => typeof id === 'string'),
    baseline: normalizeItemBaseline(source.baseline),
  }
}

/**
 * Rebuilds a room and its items.
 *
 * @param {JsonValue} value The saved room.
 * @param {IdChecker} ids The ids used so far.
 * @returns {Room} The room.
 */
function normalizeRoom(value: JsonValue, ids: IdChecker): Room {
  const source = asObject(value)

  return {
    id: ids.claim(readString(source, 'id')),
    name: readString(source, 'name'),
    items: asArray(source.items).map(item => normalizeItem(item, ids)),
  }
}

/**
 * Rebuilds a signature. One without a drawn PNG image, a signature line or a
 * valid time is dropped, so nothing can pass for a signature that isn't one.
 *
 * @param {JsonValue} value The saved signature.
 * @returns {Signature | undefined} The signature, or undefined when it's not valid.
 */
function normalizeSignature(value: JsonValue): Signature | undefined {
  const source = asObject(value)
  const slot = readString(source, 'slot')
  const image = readString(source, 'image')
  const signedAt = readTimestamp(source, 'signedAt')

  if (slot === '' || !image.startsWith(SIGNATURE_PREFIX) || signedAt === '') {
    return undefined
  }

  return {
    slot,
    role: readChoice(source, 'role', ['tenant', 'landlord']),
    name: readString(source, 'name'),
    image,
    signedAt,
  }
}

/**
 * Rebuilds the signatures, keeping the first one for each signature line.
 *
 * @param {JsonValue | undefined} value The saved signatures.
 * @returns {Signature[]} The valid signatures.
 */
function normalizeSignatures(value: JsonValue | undefined): Signature[] {
  const signatures: Signature[] = []

  for (const saved of asArray(value)) {
    const signature = normalizeSignature(saved)

    if (signature && signatures.every(other => other.slot !== signature.slot)) {
      signatures.push(signature)
    }
  }

  return signatures
}

/**
 * Rebuilds the record of the inspection a move-out was started from.
 *
 * @param {JsonValue | undefined} value The saved baseline.
 * @returns {Baseline | null} The baseline, or null when there isn't one.
 */
function normalizeBaseline(value: JsonValue | undefined): Baseline | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }

  return {
    id: readString(value, 'id'),
    kind: readChoice(value, 'kind', KINDS),
    date: readString(value, 'date'),
    keys: readString(value, 'keys'),
  }
}

/**
 * Rebuilds an inspection from the browser's storage or a backup file,
 * keeping only fields of the right type. Neither source is trusted: a file
 * can be edited by hand, and an older version of the app saved less.
 *
 * @param {JsonValue | undefined} value The saved inspection.
 * @returns {Inspection | undefined} The inspection, or undefined when it has no id.
 */
function normalizeInspection(
  value: JsonValue | undefined,
): Inspection | undefined {
  const source = asObject(value)
  const id = readString(source, 'id')

  if (id === '') {
    return undefined
  }

  const ids = new IdChecker()
  const timeZone = readString(source, 'timeZone')
  const createdAt =
    readTimestamp(source, 'createdAt') || new Date().toISOString()

  return {
    id,
    kind: readChoice(source, 'kind', KINDS),
    address: readString(source, 'address'),
    date: readString(source, 'date'),
    landlord: readString(source, 'landlord'),
    tenants: readString(source, 'tenants'),
    keys: readString(source, 'keys'),
    meters: readString(source, 'meters'),
    notes: readString(source, 'notes'),
    tenantComments: readString(source, 'tenantComments'),
    rooms: asArray(source.rooms).map(room => normalizeRoom(room, ids)),
    signatures: normalizeSignatures(source.signatures),
    baseline: normalizeBaseline(source.baseline),
    timeZone: isTimeZone(timeZone) ? timeZone : 'UTC',
    createdAt,
    updatedAt: readTimestamp(source, 'updatedAt') || createdAt,
  }
}

export { normalizeInspection }
