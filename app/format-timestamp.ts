/**
 * Formats a moment as a date and time in a given time zone, with the zone
 * named, such as "October 3, 2026 at 8:14 p.m. EDT". A report shows every
 * time in the zone the inspection happened in, whatever device opens it.
 *
 * @param {string} timestamp The moment, in ISO 8601 form.
 * @param {string} timeZone The IANA time zone, such as "America/Toronto".
 * @returns {string} The formatted time, or the input unchanged when it isn't a time.
 */
function formatTimestamp(timestamp: string, timeZone: string): string {
  const time = Date.parse(timestamp)

  if (Number.isNaN(time)) {
    return timestamp
  }

  const formatted = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
    timeZoneName: 'short',
  }).format(time)

  // Newer browsers put a narrow no-break space before "p.m.", which the PDF
  // fonts can't draw. A plain space reads the same.
  return formatted.replaceAll(/\s/gu, ' ')
}

export { formatTimestamp }
