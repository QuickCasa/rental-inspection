/**
 * Object URLs for the photos on screen, by photo id. Each photo gets one URL
 * while its inspection is open, and they're all released when it closes.
 */
const urls = new Map<string, string>()

/**
 * Remembers a photo so its thumbnail can be shown.
 *
 * @param {string} id The photo's id.
 * @param {Blob} blob The photo.
 */
function addPhotoUrl(id: string, blob: Blob): void {
  if (!urls.has(id)) {
    urls.set(id, URL.createObjectURL(blob))
  }
}

/**
 * Finds a photo's URL.
 *
 * @param {string} id The photo's id.
 * @returns {string | undefined} The URL, or undefined when the photo isn't loaded.
 */
function getPhotoUrl(id: string): string | undefined {
  return urls.get(id)
}

/**
 * Releases one photo's URL, after the photo is removed.
 *
 * @param {string} id The photo's id.
 */
function releasePhotoUrl(id: string): void {
  const url = urls.get(id)

  if (url === undefined) {
    return
  }

  URL.revokeObjectURL(url)
  urls.delete(id)
}

/**
 * Releases every photo URL, when an inspection closes.
 */
function releaseAllPhotoUrls(): void {
  for (const url of urls.values()) {
    URL.revokeObjectURL(url)
  }

  urls.clear()
}

export { addPhotoUrl, getPhotoUrl, releaseAllPhotoUrls, releasePhotoUrl }
