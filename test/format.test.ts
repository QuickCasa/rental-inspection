import { describe, expect, it } from 'vitest'
import { formatDate } from '../app/format-date.js'
import { formatTimestamp } from '../app/format-timestamp.js'
import { getLocalDate, isTimeZone } from '../app/local-time.js'
import { toPdfText } from '../app/pdf/to-pdf-text.js'
import { toFileName } from '../app/to-file-name.js'

describe('formatTimestamp', () => {
  it('shows the time in the inspection time zone, with the zone named', () => {
    const formatted = formatTimestamp(
      '2026-10-03T18:14:00.000Z',
      'America/Toronto',
    )

    expect(formatted).toContain('October 3, 2026')
    expect(formatted).toContain('2:14')
    expect(formatted).toContain('EDT')
    expect(formatted).not.toMatch(/[^ -~]/u)
  })

  it('leaves anything that is not a time alone', () => {
    expect(formatTimestamp('soon', 'UTC')).toBe('soon')
  })
})

describe('dates', () => {
  it('formats dates from a date input and leaves anything else alone', () => {
    expect(formatDate('2026-10-03')).toBe('October 3, 2026')
    expect(formatDate('next spring')).toBe('next spring')
  })

  it("gives today's date on this device", () => {
    expect(getLocalDate(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
  })

  it('checks time zone names', () => {
    expect(isTimeZone('America/Vancouver')).toBe(true)
    expect(isTimeZone('Mars/Olympus_Mons')).toBe(false)
    expect(isTimeZone('')).toBe(false)
  })
})

describe('toPdfText', () => {
  it('keeps Western European text and replaces what the fonts cannot draw', () => {
    expect(toPdfText('Zoë’s café, €20')).toBe('Zoë’s café, €20')
    expect(toPdfText('Cracked 🪟 tile, 小')).toBe('Cracked ? tile, ?')
    expect(toPdfText('8:14\u{202F}p.m.\tok\r\nnext')).toBe('8:14 p.m. ok\nnext')
  })
})

describe('toFileName', () => {
  it('builds a safe name and falls back when there is nothing to use', () => {
    expect(
      toFileName(['Move-out inspection', 'Rue Saint-Denis, Montréal'], 'pdf'),
    ).toBe('move-out-inspection-rue-saint-denis-montreal.pdf')
    expect(toFileName(['', '  '], 'json')).toBe('inspection.json')
  })
})
