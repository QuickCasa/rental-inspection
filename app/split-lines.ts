/**
 * Splits text with one entry per line, such as a list of names, dropping
 * blank lines and stray spaces.
 *
 * @param {string} text The text.
 * @returns {string[]} The entries.
 */
function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '')
}

export { splitLines }
