import type { jsPDF as JsPdf } from 'jspdf'
import type { PdfBox, PdfCell, PdfTextOptions, WrappedRow } from '../types.js'
import { toPdfText } from './to-pdf-text.js'

const PAGE_MARGIN = 54
const FOOTER_SPACE = 36
const BODY_SIZE = 11
const TABLE_SIZE = 10
const LINE_HEIGHT = 1.35
const CELL_GAP = 10
const ROW_PADDING = 5
const MUTED = 90
const RULE = 200

/**
 * Lays text, tables and images out top to bottom on US Letter pages,
 * starting a new page whenever the next block wouldn't fit. Every string
 * passes through toPdfText, because the built-in PDF fonts can't draw every
 * character.
 */
class PdfWriter {
  private cursor = PAGE_MARGIN
  private readonly bottom: number
  readonly pdf: JsPdf
  readonly left = PAGE_MARGIN
  readonly width: number

  constructor(pdf: JsPdf) {
    this.pdf = pdf
    this.width = pdf.internal.pageSize.getWidth() - PAGE_MARGIN * 2
    this.bottom = pdf.internal.pageSize.getHeight() - PAGE_MARGIN - FOOTER_SPACE
  }

  /**
   * Sets the font for the next text.
   *
   * @param {number} size The font size.
   * @param {boolean} bold Whether it's bold.
   * @param {boolean} muted Whether it's grey.
   */
  private setFont(size: number, bold = false, muted = false): void {
    this.pdf.setFont('helvetica', bold ? 'bold' : 'normal')
    this.pdf.setFontSize(size)
    this.pdf.setTextColor(muted ? MUTED : 0)
  }

  /**
   * Splits text into lines that fit a width, in the current font.
   *
   * @param {string} text The text.
   * @param {number} width The width.
   * @returns {string[]} The lines.
   */
  private wrap(text: string, width: number): string[] {
    return this.pdf.splitTextToSize(toPdfText(text), width) as string[]
  }

  /**
   * Splits each cell of a table row into lines that fit its column.
   *
   * @param {readonly PdfCell[]} cells The cells, left to right.
   * @param {number} size The font size.
   * @returns {WrappedRow} Each cell's lines, and the most lines any cell has.
   */
  private wrapCells(cells: readonly PdfCell[], size: number): WrappedRow {
    const wrapped = cells.map(cell => {
      this.setFont(size, cell.bold, cell.muted)
      return this.wrap(cell.text, cell.width - CELL_GAP)
    })

    return {
      wrapped,
      lineCount: Math.max(1, ...wrapped.map(lines => lines.length)),
    }
  }

  /**
   * The current distance from the top of the page, in points.
   *
   * @returns {number} The cursor position.
   */
  get y(): number {
    return this.cursor
  }

  /**
   * The most a single page can hold, in points.
   *
   * @returns {number} The height between the margins.
   */
  get pageHeight(): number {
    return this.bottom - PAGE_MARGIN
  }

  /**
   * Starts a new page if fewer than `height` points are left on this one.
   *
   * @param {number} height The space the next block needs.
   */
  ensureSpace(height: number): void {
    if (this.cursor + height <= this.bottom) {
      return
    }

    this.newPage()
  }

  /**
   * Starts a new page, unless the current one is still empty.
   */
  newPage(): void {
    if (this.cursor === PAGE_MARGIN) {
      return
    }

    this.pdf.addPage()
    this.cursor = PAGE_MARGIN
  }

  /**
   * Moves the cursor down.
   *
   * @param {number} points The distance.
   */
  space(points: number): void {
    this.cursor += points
  }

  /**
   * Puts the cursor at a position on the current page, such as the top of a
   * second column.
   *
   * @param {number} y The position, in points from the top.
   */
  setCursor(y: number): void {
    this.cursor = y
  }

  /**
   * Writes wrapped text.
   *
   * @param {string} text The text. Line breaks are kept.
   * @param {PdfTextOptions} options How to set it.
   */
  text(text: string, options: PdfTextOptions = {}): void {
    const size = options.size ?? BODY_SIZE
    const lineHeight = size * LINE_HEIGHT
    const x = options.x ?? this.left
    const width = options.width ?? this.width - (x - this.left)

    this.setFont(size, options.bold, options.muted)

    for (const line of this.wrap(text, width)) {
      this.ensureSpace(lineHeight)
      this.pdf.text(line, x, this.cursor + size)
      this.cursor += lineHeight
    }
  }

  /**
   * Writes a section heading with space above it, kept on the same page as at
   * least a few lines of what follows.
   *
   * @param {string} text The heading.
   * @param {number} size The font size.
   */
  heading(text: string, size = 14): void {
    this.ensureSpace(size * 5)
    this.space(size * 0.8)
    this.text(text, { size, bold: true })
    this.space(4)
  }

  /**
   * Writes a label and value side by side, such as "Tenants" and two names.
   *
   * @param {string} label The label.
   * @param {string} value The value.
   * @param {number} labelWidth How much room the label gets.
   */
  fact(label: string, value: string, labelWidth = 130): void {
    this.ensureSpace(BODY_SIZE * LINE_HEIGHT * 2)

    const top = this.cursor
    const page = this.pdf.getNumberOfPages()

    this.text(label, {
      size: 9.5,
      bold: true,
      muted: true,
      width: labelWidth - CELL_GAP,
    })

    const labelBottom = this.cursor
    this.cursor = top
    this.text(value, { x: this.left + labelWidth })

    // A long value can carry on over a page break, and then the label's
    // position on the earlier page no longer matters.
    const samePage = this.pdf.getNumberOfPages() === page
    this.cursor =
      (samePage ? Math.max(this.cursor, labelBottom) : this.cursor) + 2
  }

  /**
   * Whether a block fits on the rest of this page.
   *
   * @param {number} height The block's height.
   * @returns {boolean} True when it fits.
   */
  fits(height: number): boolean {
    return this.cursor + Math.min(height, this.pageHeight) <= this.bottom
  }

  /**
   * Measures how tall a table row will be, so a table can start a new page,
   * with its headings, before a row that won't fit.
   *
   * @param {readonly PdfCell[]} cells The cells, left to right.
   * @param {number} size The font size.
   * @returns {number} The row's height, in points.
   */
  measureRow(cells: readonly PdfCell[], size = TABLE_SIZE): number {
    return (
      this.wrapCells(cells, size).lineCount * size * LINE_HEIGHT +
      ROW_PADDING * 2
    )
  }

  /**
   * Writes one row of a table. Each cell wraps within its width. A row that
   * fits on a page is kept together, and a longer one carries on over the
   * page break.
   *
   * @param {readonly PdfCell[]} cells The cells, left to right.
   * @param {number} size The font size.
   */
  row(cells: readonly PdfCell[], size = TABLE_SIZE): void {
    const lineHeight = size * LINE_HEIGHT
    const { lineCount, wrapped } = this.wrapCells(cells, size)

    this.ensureSpace(
      Math.min(lineCount * lineHeight + ROW_PADDING * 2, this.pageHeight),
    )
    this.space(ROW_PADDING)

    for (let index = 0; index < lineCount; index += 1) {
      this.ensureSpace(lineHeight)

      let x = this.left

      for (const [cellIndex, cell] of cells.entries()) {
        const line = wrapped[cellIndex]?.[index]

        if (line !== undefined) {
          this.setFont(size, cell.bold, cell.muted)
          this.pdf.text(line, x, this.cursor + size)
        }

        x += cell.width
      }

      this.cursor += lineHeight
    }

    this.space(ROW_PADDING)
    this.rule()
  }

  /**
   * Draws a thin grey line across the page at the cursor.
   */
  rule(): void {
    this.pdf.setDrawColor(RULE)
    this.pdf.setLineWidth(0.5)
    this.pdf.line(this.left, this.cursor, this.left + this.width, this.cursor)
  }

  /**
   * Draws a line to sign or write on, with a label under it.
   *
   * @param {string} label What goes on the line, such as "Signature".
   * @param {number} x Where the line starts.
   * @param {number} width How long it is.
   */
  signatureLine(label: string, x: number, width: number): void {
    const lineY = this.cursor + 28

    this.pdf.setDrawColor(0)
    this.pdf.setLineWidth(0.75)
    this.pdf.line(x, lineY, x + width, lineY)
    this.setFont(9, false, true)
    this.pdf.text(toPdfText(label), x, lineY + 12)
  }

  /**
   * Draws an image scaled to fit a box, keeping its proportions.
   *
   * @param {string | Uint8Array} data The image, as a data URL or bytes.
   * @param {'JPEG' | 'PNG'} format The image format.
   * @param {PdfBox} box Where it goes, and the most room it can take.
   * @returns {number} The drawn image's height.
   */
  image(
    data: string | Uint8Array,
    format: 'JPEG' | 'PNG',
    box: PdfBox,
  ): number {
    const properties = this.pdf.getImageProperties(data)
    const scale = Math.min(
      box.width / properties.width,
      box.height / properties.height,
    )
    const height = properties.height * scale

    // jsPDF stores PNG pixels uncompressed unless asked, which makes each
    // signature over a megabyte. JPEGs are stored as they are either way.
    this.pdf.addImage(
      data,
      format,
      box.x,
      box.y,
      properties.width * scale,
      height,
      undefined,
      'FAST',
    )

    return height
  }

  /**
   * Writes a footer on every page, with the page number.
   *
   * @param {string} text The footer text, before the page number.
   */
  footer(text: string): void {
    const pageCount = this.pdf.getNumberOfPages()
    const footerY = this.pdf.internal.pageSize.getHeight() - PAGE_MARGIN

    for (let page = 1; page <= pageCount; page += 1) {
      this.pdf.setPage(page)
      this.setFont(8.5, false, true)
      this.pdf.text(
        toPdfText(`${text}Page ${String(page)} of ${String(pageCount)}`),
        this.left,
        footerY,
      )
    }
  }
}

export { PdfWriter }
