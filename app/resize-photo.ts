import { PHOTO_MAX_SIZE, PHOTO_QUALITY } from './constants.js'
import type { ResizedPhoto } from './types.js'

/**
 * Scales a photo down to fit PHOTO_MAX_SIZE and re-encodes it as JPEG, so a
 * 12 megapixel phone photo becomes small enough to store, and still shows
 * damage clearly in the PDF. The browser applies the photo's rotation as it
 * decodes it, and re-encoding drops its location and camera data. The photo
 * never leaves the device.
 *
 * @param {Blob} file The chosen image.
 * @returns {Promise<ResizedPhoto>} The photo as a JPEG, with its size in pixels.
 */
async function resizePhoto(file: Blob): Promise<ResizedPhoto> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(
    1,
    PHOTO_MAX_SIZE / Math.max(bitmap.width, bitmap.height),
  )
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))

  const context = canvas.getContext('2d')

  if (context === null) {
    bitmap.close()
    throw new Error("This browser can't process images.")
  }

  // JPEG has no transparency, so transparent areas get a white background
  // instead of black.
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const blob = await new Promise<Blob | null>(resolve => {
    canvas.toBlob(resolve, 'image/jpeg', PHOTO_QUALITY)
  })

  if (blob === null) {
    throw new Error("This browser couldn't save the photo.")
  }

  return { blob, width: canvas.width, height: canvas.height }
}

export { resizePhoto }
