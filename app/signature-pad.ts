const INK = '#000000'
const PAPER = '#ffffff'
const LINE_WIDTH = 2.5

/**
 * A box to sign in with a finger, stylus or mouse. It always draws black ink
 * on white, whatever the page's colour scheme, so the signature prints
 * clearly in the PDF.
 */
class SignaturePad {
  private readonly canvas: HTMLCanvasElement
  private readonly context: CanvasRenderingContext2D
  private drawing = false
  private strokes = 0
  private lastX = 0
  private lastY = 0

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d')

    if (context === null) {
      throw new Error("This browser can't draw signatures.")
    }

    this.canvas = canvas
    this.context = context

    canvas.addEventListener('pointerdown', pointerEvent => {
      this.start(pointerEvent)
    })
    canvas.addEventListener('pointermove', pointerEvent => {
      this.move(pointerEvent)
    })
    canvas.addEventListener('pointerup', () => {
      this.drawing = false
    })
    canvas.addEventListener('pointercancel', () => {
      this.drawing = false
    })
  }

  /**
   * Finds where a pointer is on the pad, in the pad's own units.
   *
   * @param {PointerEvent} pointerEvent The pointer event.
   * @returns {DOMPoint} The position.
   */
  private locate(pointerEvent: PointerEvent): DOMPoint {
    const box = this.canvas.getBoundingClientRect()
    return new DOMPoint(
      pointerEvent.clientX - box.left,
      pointerEvent.clientY - box.top,
    )
  }

  /**
   * Starts a stroke, with a dot so a tap still leaves a mark.
   *
   * @param {PointerEvent} pointerEvent The pointer event.
   */
  private start(pointerEvent: PointerEvent): void {
    const point = this.locate(pointerEvent)

    pointerEvent.preventDefault()

    try {
      // Keeps the stroke going when a finger slides past the edge of the box.
      this.canvas.setPointerCapture(pointerEvent.pointerId)
    } catch {
      // Without capture, a stroke just ends at the edge.
    }

    this.drawing = true
    this.strokes += 1
    this.lastX = point.x
    this.lastY = point.y

    this.context.fillStyle = INK
    this.context.beginPath()
    this.context.arc(point.x, point.y, LINE_WIDTH / 2, 0, Math.PI * 2)
    this.context.fill()
  }

  /**
   * Continues a stroke to the pointer's new position.
   *
   * @param {PointerEvent} pointerEvent The pointer event.
   */
  private move(pointerEvent: PointerEvent): void {
    if (!this.drawing) {
      return
    }

    const point = this.locate(pointerEvent)

    pointerEvent.preventDefault()
    this.context.strokeStyle = INK
    this.context.lineWidth = LINE_WIDTH
    this.context.lineCap = 'round'
    this.context.lineJoin = 'round'
    this.context.beginPath()
    this.context.moveTo(this.lastX, this.lastY)
    this.context.lineTo(point.x, point.y)
    this.context.stroke()
    this.lastX = point.x
    this.lastY = point.y
  }

  /**
   * Whether anything has been drawn since the pad was last cleared.
   *
   * @returns {boolean} True when the pad is blank.
   */
  get isEmpty(): boolean {
    return this.strokes === 0
  }

  /**
   * Sizes the pad to fit its box at the screen's pixel density, and clears
   * it. Call it each time the pad is shown.
   */
  reset(): void {
    const ratio = window.devicePixelRatio || 1
    const box = this.canvas.getBoundingClientRect()

    this.canvas.width = Math.max(1, Math.round(box.width * ratio))
    this.canvas.height = Math.max(1, Math.round(box.height * ratio))
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0)
    this.clear()
  }

  /**
   * Wipes the pad back to blank paper.
   */
  clear(): void {
    this.context.save()
    this.context.setTransform(1, 0, 0, 1, 0, 0)
    this.context.fillStyle = PAPER
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
    this.context.restore()
    this.strokes = 0
  }

  /**
   * The signature as a PNG.
   *
   * @returns {string} A PNG data URL.
   */
  toDataUrl(): string {
    return this.canvas.toDataURL('image/png')
  }
}

export { SignaturePad }
