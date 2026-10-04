/**
 * Builds a safe file name from words such as the inspection type and address,
 * for example "move-in-inspection-12-maple-court-unit-4-2026-10-03.pdf".
 *
 * @param {readonly string[]} words The words, in order. Blank ones are skipped.
 * @param {string} extension The extension, such as "pdf".
 * @returns {string} The file name.
 */
function toFileName(words: readonly string[], extension: string): string {
  const slug = words
    .join(' ')
    .normalize('NFKD')
    .replaceAll(/\p{M}/gu, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, '-')
    .replaceAll(/^-+|-+$/gu, '')
    .slice(0, 80)
    .replace(/-+$/u, '')

  return `${slug || 'inspection'}.${extension}`
}

export { toFileName }
