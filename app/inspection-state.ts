import { putInspection } from './database/inspections.js'
import type { Inspection } from './types.js'

const SAVE_DELAY = 400

/**
 * The open inspection, and saving it as it changes. Typing saves after a
 * short pause, and anything that must not be lost, such as a signature,
 * saves at once. Nothing is written unless something changed, so opening an
 * inspection doesn't move it to the top of the list.
 */
class InspectionState {
  private timer: ReturnType<typeof setTimeout> | undefined
  private saving: Promise<boolean> = Promise.resolve(true)
  private dirty = false
  private readonly onSaved: (saved: boolean) => void
  current: Inspection | undefined

  /**
   * @param {(saved: boolean) => void} onSaved Called after each save with whether it worked.
   */
  constructor(onSaved: (saved: boolean) => void) {
    this.onSaved = onSaved
  }

  /**
   * Saves a copy of the inspection, once any earlier save has finished, so
   * saves always land in order. A failed save is tried again next time.
   *
   * @param {Promise<boolean>} previous The save before this one.
   * @param {Inspection} snapshot The inspection as it is now.
   * @returns {Promise<boolean>} Whether the save worked.
   */
  private async write(
    previous: Promise<boolean>,
    snapshot: Inspection,
  ): Promise<boolean> {
    await previous

    try {
      await putInspection(snapshot)
      this.onSaved(true)
      return true
    } catch {
      this.dirty = true
      this.onSaved(false)
      return false
    }
  }

  /**
   * Whether anyone has signed, which locks the report.
   *
   * @returns {boolean} True when the report is signed.
   */
  get locked(): boolean {
    return (this.current?.signatures.length ?? 0) > 0
  }

  /**
   * Notes a change and saves it after a short pause, so typing doesn't save
   * on every key.
   */
  schedule(): void {
    this.dirty = true
    clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      void this.flush()
    }, SAVE_DELAY)
  }

  /**
   * Notes a change and saves it now.
   *
   * @returns {Promise<boolean>} Whether the save worked.
   */
  save(): Promise<boolean> {
    this.dirty = true
    return this.flush()
  }

  /**
   * Saves any change still waiting, after any save already under way.
   *
   * @returns {Promise<boolean>} Whether the last save worked.
   */
  flush(): Promise<boolean> {
    clearTimeout(this.timer)
    this.timer = undefined

    const { current } = this

    if (!current || !this.dirty) {
      return this.saving
    }

    this.dirty = false
    current.updatedAt = new Date().toISOString()
    // A copy, so edits made while an earlier save finishes wait for the next
    // save instead of slipping into this one.
    this.saving = this.write(this.saving, structuredClone(current))

    return this.saving
  }
}

export { InspectionState }
