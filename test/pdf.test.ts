import { jsPDF as JsPdf } from 'jspdf'
import { describe, expect, it } from 'vitest'
import { createMoveOut } from '../app/create-move-out.js'
import { buildReportPdf } from '../app/pdf/build-report-pdf.js'
import type { Inspection, PhotoData } from '../app/types.js'
import {
  createFilledInspection,
  createTestPhoto,
  createTestSignature,
} from './fixtures/create-filled-inspection.js'

const NOW = new Date('2026-10-03T19:05:00.000Z')

/**
 * Builds a report and returns its raw PDF text, which holds every string
 * drawn on its pages because jsPDF doesn't compress by default.
 *
 * @param {Inspection} inspection The inspection.
 * @param {readonly PhotoData[]} photos Its photos.
 * @returns {string} The PDF source.
 */
function reportSource(
  inspection: Inspection,
  photos: readonly PhotoData[] = [],
): string {
  const photoMap = new Map(photos.map(photo => [photo.id, photo]))
  return buildReportPdf(inspection, photoMap, JsPdf, NOW).output()
}

describe('buildReportPdf', () => {
  it('lists the facts, each room, ratings, notes and photo numbers', () => {
    const source = reportSource(createFilledInspection(), [
      createTestPhoto('photo-1'),
    ])

    expect(source).toContain('Move-in inspection report')
    expect(source).toContain('12 Maple Court, Unit 4, Kitchener, ON')
    expect(source).toContain('October 3, 2026')
    expect(source).toContain('Jordan Lee, Sam Rivera')
    expect(source).toContain('2 door keys, 1 mailbox key')
    expect(source).toContain('2 of 4')
    expect(source).toContain('Report made')
    expect(source).toContain('3:05 p.m. EDT')
    expect(source).toContain('Kitchen')
    expect(source).toContain('Countertops')
    expect(source).toContain('Fair')
    expect(source).toContain('Small scratch left of the sink.')
    expect(source).toContain('Photo 1')
    expect(source).toContain('Not rated')
    expect(source).not.toContain('Changes since')
  })

  it('puts every photo on its own pages with where it was taken and when it was added', () => {
    const pdf = buildReportPdf(
      createFilledInspection(),
      new Map([['photo-1', createTestPhoto('photo-1')]]),
      JsPdf,
      NOW,
    )
    const source = pdf.output()

    expect(source).toContain('/Subtype /Image')
    expect(source).toContain('Photo 1. Kitchen, Countertops.')
    expect(source).toContain('Added October 3, 2026 at 2:14 p.m. EDT.')
    expect(pdf.getNumberOfPages()).toBeGreaterThan(1)
  })

  it('leaves out photos that are missing from storage', () => {
    const source = reportSource(createFilledInspection())

    expect(source).not.toContain('Photo 1')
    expect(source).not.toContain('/Subtype /Image')
  })

  it('leaves lines to sign by hand until someone signs in the app', () => {
    const source = reportSource(createFilledInspection())

    expect(source).toContain('Landlord or agent: Maple Court Properties')
    expect(source).toContain('Tenant: Jordan Lee')
    expect(source).toContain('Tenant: Sam Rivera')
    expect(source).toContain('Signature')
    expect(source).not.toContain('Signed ')
    expect(source).not.toContain('/Filter /FlateDecode')
  })

  it('shows drawn signatures with when each person signed', () => {
    const inspection = createFilledInspection()
    inspection.signatures = [
      createTestSignature({}),
      createTestSignature({
        slot: 'tenant-0',
        role: 'tenant',
        name: 'Jordan Lee',
        signedAt: '2026-10-03T18:45:00.000Z',
      }),
    ]
    inspection.tenantComments = 'The dishwasher was loud when we tested it.'

    const source = reportSource(inspection)

    expect(source).toContain('Landlord or agent: Priya Shah')
    expect(source).toContain('Signed October 3, 2026 at 2:40 p.m. EDT')
    expect(source).toContain('Signed October 3, 2026 at 2:45 p.m. EDT')
    expect(source).toContain('Comments from the tenant')
    expect(source).toContain('The dishwasher was loud when we tested it.')
    expect(source).toContain('/Subtype /Image')
    // Signatures are PNGs, compressed so a report stays small enough to email.
    expect(source).toContain('/Filter /FlateDecode')
  })

  it('compares a move-out with the move-in and lists what got worse', () => {
    const moveOut = createMoveOut(createFilledInspection())
    const [countertops, fridge] = moveOut.rooms[0]?.items ?? []

    if (!countertops || !fridge) {
      throw new Error('The test inspection is missing items.')
    }

    countertops.condition = 'poor'
    countertops.notes = 'Burn mark by the stove.'
    fridge.condition = 'good'
    moveOut.keys = '1 door key'

    const source = reportSource(moveOut)

    expect(source).toContain('Move-out inspection report')
    expect(source).toContain('The move-in inspection of October 3, 2026')
    expect(source).toContain('Keys at move-in')
    expect(source).toContain('Keys now')
    expect(source).toContain('Changes since move-in')
    expect(source).toContain('Kitchen: Countertops')
    expect(source).toContain(
      'Fair at move-in, poor now. Burn mark by the stove.',
    )
    expect(source).toContain('At move-in')
    expect(source).toContain('Poor, worse')
    // The move-in column is narrow, so its text wraps over lines.
    expect(source).toContain('1 photo in that')
  })

  it('says so when nothing got worse', () => {
    const source = reportSource(createMoveOut(createFilledInspection()))

    expect(source).toContain('No item is rated worse than at move-in.')
  })

  it('starts new pages for long reports and numbers them', () => {
    const inspection = createFilledInspection()
    const kitchenItems = inspection.rooms[0]?.items ?? []

    for (const item of kitchenItems) {
      item.notes = 'A long note about this item. '.repeat(120)
    }

    const pdf = buildReportPdf(inspection, new Map(), JsPdf, NOW)
    const pages = pdf.getNumberOfPages()

    expect(pages).toBeGreaterThan(2)
    expect(pdf.output()).toContain('Kitchen, continued')
    expect(pdf.output()).toContain(`Page ${String(pages)} of ${String(pages)}`)
  })
})
