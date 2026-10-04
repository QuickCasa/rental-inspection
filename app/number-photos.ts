import type { Inspection, NumberedPhoto, PhotoMap } from './types.js'

/**
 * Numbers the report's photos in the order they appear, room by room and
 * item by item, so the checklist can point to "photo 4". Photos that are
 * missing from storage are skipped.
 *
 * @param {Inspection} inspection The inspection.
 * @param {PhotoMap} photos The stored photos, by id.
 * @returns {NumberedPhoto[]} The photos with their numbers.
 */
function numberPhotos(
  inspection: Inspection,
  photos: PhotoMap,
): NumberedPhoto[] {
  const numbered: NumberedPhoto[] = []

  for (const room of inspection.rooms) {
    for (const item of room.items) {
      for (const photoId of item.photoIds) {
        const photo = photos.get(photoId)

        if (photo) {
          numbered.push({
            number: numbered.length + 1,
            itemId: item.id,
            room: room.name.trim(),
            item: item.name.trim(),
            photo,
          })
        }
      }
    }
  }

  return numbered
}

export { numberPhotos }
