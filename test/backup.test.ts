import { describe, expect, it } from 'vitest'
import { base64ToBytes, bytesToBase64 } from '../app/base64.js'
import {
  createBackupText,
  readBackupText,
  withNewIds,
} from '../app/backup-file.js'
import {
  createFilledInspection,
  createTestPhoto,
} from './fixtures/create-filled-inspection.js'

describe('base64', () => {
  it('round-trips bytes, including ones larger than a chunk', () => {
    const bytes = Uint8Array.from({ length: 70_000 }, (_, index) => index % 256)

    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes)
    expect(base64ToBytes('not base64!')).toBeUndefined()
  })
})

describe('backup files', () => {
  it('round-trip an inspection and its photos', () => {
    const inspection = createFilledInspection()
    const photo = createTestPhoto('photo-1')

    const backup = readBackupText(createBackupText(inspection, [photo]))

    expect(backup?.inspection).toEqual(inspection)
    expect(backup?.photos).toEqual([photo])
  })

  it('drop photos that are not JPEGs, and references to missing photos', () => {
    const inspection = createFilledInspection()
    const fake = {
      ...createTestPhoto('photo-1'),
      bytes: new Uint8Array([1, 2, 3]),
    }

    const backup = readBackupText(createBackupText(inspection, [fake]))

    expect(backup?.photos).toEqual([])
    expect(backup?.inspection.rooms[0]?.items[0]?.photoIds).toEqual([])
  })

  it('refuse files from another app or a newer version', () => {
    const text = createBackupText(createFilledInspection(), [])
    const newer = text.replace('"version":1', '"version":2')

    expect(readBackupText('{}')).toBeUndefined()
    expect(readBackupText('not json')).toBeUndefined()
    expect(readBackupText(newer)).toBeUndefined()
  })

  it('get new ids when opened, with photo links kept', () => {
    const inspection = createFilledInspection()
    const backup = { inspection, photos: [createTestPhoto('photo-1')] }

    const copy = withNewIds(backup)
    const [newPhoto] = copy.photos

    expect(copy.inspection.id).not.toBe(inspection.id)
    expect(newPhoto?.id).not.toBe('photo-1')
    expect(copy.inspection.rooms[0]?.items[0]?.photoIds).toEqual([newPhoto?.id])
  })
})
