import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createInspection } from '../app/create-inspection.js'
import { putInspection } from '../app/database/inspections.js'
import { InspectionState } from '../app/inspection-state.js'

vi.mock('../app/database/inspections.js', () => ({
  putInspection: vi.fn(),
}))

const put = vi.mocked(putInspection)

describe('InspectionState', () => {
  beforeEach(() => {
    put.mockReset()
    put.mockResolvedValue()
  })

  it('writes nothing when nothing changed, so opening an inspection leaves it alone', async () => {
    const state = new InspectionState(() => {})
    state.current = createInspection('move-in')

    await state.flush()

    expect(put).not.toHaveBeenCalled()
  })

  it('saves a copy of the inspection as it was when the save started', async () => {
    const state = new InspectionState(() => {})
    const inspection = createInspection('move-in')
    state.current = inspection

    inspection.address = '12 Maple Court'
    const saving = state.save()
    inspection.address = 'Changed after the save started'
    await saving

    expect(put).toHaveBeenCalledTimes(1)
    expect(put.mock.calls[0]?.[0].address).toBe('12 Maple Court')
  })

  it('tries again after a failed save, and reports both', async () => {
    const results: boolean[] = []
    const state = new InspectionState(saved => {
      results.push(saved)
    })
    state.current = createInspection('routine')
    put.mockRejectedValueOnce(new Error('Quota exceeded'))

    expect(await state.save()).toBe(false)
    expect(await state.flush()).toBe(true)
    expect(results).toEqual([false, true])
    expect(put).toHaveBeenCalledTimes(2)
  })
})
