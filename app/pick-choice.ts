/**
 * Checks a value from a form control against the values it may take.
 *
 * @param {string} value The value.
 * @param {readonly T[]} allowed The allowed values.
 * @returns {T | undefined} The value, or undefined when it isn't allowed.
 */
function pickChoice<T extends string>(
  value: string,
  allowed: readonly T[],
): T | undefined {
  return allowed.find(option => option === value)
}

export { pickChoice }
