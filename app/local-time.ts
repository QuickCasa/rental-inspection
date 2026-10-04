/**
 * Today's date on this device, as YYYY-MM-DD for a date input.
 *
 * @param {Date} now The current time.
 * @returns {string} The date.
 */
function getLocalDate(now: Date): string {
  const year = String(now.getFullYear()).padStart(4, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * This device's time zone, such as "America/Toronto".
 *
 * @returns {string} The IANA time zone name, or UTC when the browser won't say.
 */
function getTimeZone(): string {
  return new Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

/**
 * Checks a time zone name, which can come from a backup file someone edited.
 *
 * @param {string} timeZone The name.
 * @returns {boolean} Whether this browser can format times in it.
 */
function isTimeZone(timeZone: string): boolean {
  if (timeZone === '') {
    return false
  }

  try {
    new Intl.DateTimeFormat('en-CA', { timeZone }).format(0)
    return true
  } catch {
    return false
  }
}

export { getLocalDate, getTimeZone, isTimeZone }
