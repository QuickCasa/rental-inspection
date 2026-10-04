/**
 * Formats a date from a date input, such as 2026-10-03, as "October 3, 2026".
 * The date is read as UTC so it can't shift a day in the reader's time zone.
 *
 * @param {string} isoDate The date, as YYYY-MM-DD.
 * @returns {string} The formatted date, or the input unchanged when it isn't a date.
 */
function formatDate(isoDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(isoDate)) {
    return isoDate
  }

  const date = new Date(`${isoDate}T00:00:00Z`)

  if (Number.isNaN(date.getTime())) {
    return isoDate
  }

  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(date)
}

export { formatDate }
