import { confirmClick, getElement } from './dom.js'
import type { PhotoChoice } from './types.js'

let resolver: ((choice: PhotoChoice) => void) | undefined
let wired = false

/**
 * Closes the dialog and hands back the choice.
 *
 * @param {HTMLDialogElement} dialog The dialog.
 * @param {PhotoChoice} choice What was chosen.
 */
function finish(dialog: HTMLDialogElement, choice: PhotoChoice): void {
  const resolve = resolver
  resolver = undefined

  if (dialog.open) {
    dialog.close()
  }

  resolve?.(choice)
}

/**
 * Shows a photo full size, with its caption, and offers to remove it.
 *
 * @param {string} url The photo's URL.
 * @param {string} caption Where it was taken and when it was added.
 * @param {boolean} canRemove Whether the report can still be changed.
 * @returns {Promise<PhotoChoice>} "remove" once the removal is confirmed, or "close".
 */
function openPhotoDialog(
  url: string,
  caption: string,
  canRemove: boolean,
): Promise<PhotoChoice> {
  const dialog = getElement('photo-dialog', HTMLDialogElement)
  const image = getElement('photo-large', HTMLImageElement)
  const remove = getElement('remove-photo', HTMLButtonElement)

  if (!wired) {
    wired = true
    remove.addEventListener('click', () => {
      if (confirmClick(remove)) {
        finish(dialog, 'remove')
      }
    })
    getElement('close-photo', HTMLButtonElement).addEventListener(
      'click',
      () => {
        finish(dialog, 'close')
      },
    )
    dialog.addEventListener('close', () => {
      finish(dialog, 'close')
    })
  }

  finish(dialog, 'close')
  image.src = url
  image.alt = caption
  getElement('photo-caption', HTMLParagraphElement).textContent = caption
  remove.hidden = !canRemove
  dialog.showModal()

  const { promise, resolve } = Promise.withResolvers<PhotoChoice>()
  resolver = resolve

  return promise
}

export { openPhotoDialog }
