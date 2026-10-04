/**
 * The characters PDF's built-in fonts can draw beyond printable ASCII and
 * Latin-1: the extra Windows-1252 punctuation, such as curly quotes, dashes
 * and the euro sign.
 */
const EXTRA_CHARACTERS = new Set(
  '\u{20AC}\u{201A}\u{0192}\u{201E}\u{2026}\u{2020}\u{2021}\u{02C6}\u{2030}\u{0160}\u{2039}\u{0152}\u{017D}\u{2018}\u{2019}\u{201C}\u{201D}\u{2022}\u{2013}\u{2014}\u{02DC}\u{2122}\u{0161}\u{203A}\u{0153}\u{017E}\u{0178}',
)

/**
 * Makes text safe for the built-in PDF fonts, which only cover Western
 * European alphabets. Unusual spaces become plain ones, tabs become spaces,
 * and anything else the fonts can't draw becomes a question mark, rather
 * than the garbled symbols the PDF would otherwise show.
 *
 * @param {string} text The text.
 * @returns {string} The text with unsupported characters replaced.
 */
function toPdfText(text: string): string {
  let result = ''

  const normalized = text
    .normalize('NFC')
    .replaceAll('\r\n', '\n')
    .replaceAll('\r', '\n')

  for (const character of normalized) {
    const code = character.codePointAt(0) ?? 0
    const supported =
      character === '\n' ||
      (code >= 0x20 && code <= 0x7e) ||
      (code >= 0xa0 && code <= 0xff) ||
      EXTRA_CHARACTERS.has(character)

    if (supported) {
      result += character
    } else if (/[\t\p{Zs}]/u.test(character)) {
      result += ' '
    } else {
      result += '?'
    }
  }

  return result
}

export { toPdfText }
