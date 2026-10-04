import { base64ToBytes, bytesToBase64 } from './base64.js'
import { BACKUP_FORMAT, BACKUP_VERSION } from './constants.js'
import { normalizeInspection } from './normalize-inspection.js'
import {
  asArray,
  asObject,
  readCount,
  readString,
  readTimestamp,
} from './read-json.js'
import type { Backup, Inspection, JsonValue, PhotoData } from './types.js'

/**
 * Checks for the bytes every JPEG file starts with.
 *
 * @param {Uint8Array} bytes The file.
 * @returns {boolean} Whether it looks like a JPEG.
 */
function isJpeg(bytes: Uint8Array): boolean {
  return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
}

/**
 * Writes an inspection and its photos as the text of a backup file, which can
 * be opened on another device or kept in case the browser's storage is
 * cleared.
 *
 * @param {Inspection} inspection The inspection.
 * @param {readonly PhotoData[]} photos Its photos.
 * @param {Date} now The current time.
 * @returns {string} The file's contents, as JSON.
 */
function createBackupText(
  inspection: Inspection,
  photos: readonly PhotoData[],
  now = new Date(),
): string {
  return JSON.stringify({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    savedAt: now.toISOString(),
    inspection,
    photos: photos.map(photo => ({
      id: photo.id,
      addedAt: photo.addedAt,
      width: photo.width,
      height: photo.height,
      data: bytesToBase64(photo.bytes),
    })),
  })
}

/**
 * Reads a photo from a backup file. Anything that isn't a sized JPEG is
 * dropped.
 *
 * @param {JsonValue} value The saved photo.
 * @returns {PhotoData | undefined} The photo, or undefined when it's not valid.
 */
function readPhoto(value: JsonValue): PhotoData | undefined {
  const source = asObject(value)
  const id = readString(source, 'id')
  const width = readCount(source, 'width')
  const height = readCount(source, 'height')
  const bytes = base64ToBytes(readString(source, 'data'))

  if (id === '' || width === 0 || height === 0 || !bytes || !isJpeg(bytes)) {
    return undefined
  }

  return {
    id,
    bytes,
    width,
    height,
    addedAt: readTimestamp(source, 'addedAt'),
  }
}

/**
 * Removes references to photos the file doesn't have, so the checklist never
 * points to a photo that isn't there.
 *
 * @param {Inspection} inspection The inspection.
 * @param {ReadonlySet<string>} available The ids of the photos the file has.
 * @returns {Inspection} The inspection with only those photos.
 */
function keepAvailablePhotos(
  inspection: Inspection,
  available: ReadonlySet<string>,
): Inspection {
  return {
    ...inspection,
    rooms: inspection.rooms.map(room => ({
      ...room,
      items: room.items.map(item => ({
        ...item,
        photoIds: item.photoIds.filter(id => available.has(id)),
      })),
    })),
  }
}

/**
 * Reads a backup file. The file is checked field by field, because anyone
 * can edit one.
 *
 * @param {string} text The file's contents.
 * @returns {Backup | undefined} The inspection and photos, or undefined when it isn't a backup this version can read.
 */
function readBackupText(text: string): Backup | undefined {
  let parsed: JsonValue

  try {
    parsed = JSON.parse(text) as JsonValue
  } catch {
    return undefined
  }

  const source = asObject(parsed)
  const version = readCount(source, 'version')

  if (
    source.format !== BACKUP_FORMAT ||
    version === 0 ||
    version > BACKUP_VERSION
  ) {
    return undefined
  }

  const inspection = normalizeInspection(source.inspection)

  if (!inspection) {
    return undefined
  }

  const referenced = new Set(
    inspection.rooms.flatMap(room => room.items.flatMap(item => item.photoIds)),
  )
  const photos: PhotoData[] = []

  for (const saved of asArray(source.photos)) {
    const photo = readPhoto(saved)

    if (!photo || !referenced.has(photo.id)) {
      continue
    }

    photos.push(photo)
    referenced.delete(photo.id)
  }

  return {
    inspection: keepAvailablePhotos(
      inspection,
      new Set(photos.map(photo => photo.id)),
    ),
    photos,
  }
}

/**
 * Gives an opened backup new ids for the inspection and its photos, so
 * opening the same file twice makes two copies instead of mixing them up.
 *
 * @param {Backup} backup The backup.
 * @returns {Backup} The same inspection and photos under new ids.
 */
function withNewIds(backup: Backup): Backup {
  const photoIds = new Map(
    backup.photos.map(photo => [photo.id, crypto.randomUUID()]),
  )

  return {
    inspection: {
      ...backup.inspection,
      id: crypto.randomUUID(),
      rooms: backup.inspection.rooms.map(room => ({
        ...room,
        items: room.items.map(item => ({
          ...item,
          photoIds: item.photoIds.map(id => photoIds.get(id) ?? id),
        })),
      })),
    },
    photos: backup.photos.map(photo => ({
      ...photo,
      id: photoIds.get(photo.id) ?? photo.id,
    })),
  }
}

export { createBackupText, readBackupText, withNewIds }
