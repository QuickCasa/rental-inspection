import { getElement } from './dom.js'
import { SignaturePad } from './signature-pad.js'
import type { SignatureDialog, SignatureInput, Signer } from './types.js'

let parts: SignatureDialog | undefined
let resolver: ((result: SignatureInput | undefined) => void) | undefined

/**
 * Closes the dialog and hands back what was entered.
 *
 * @param {SignatureInput | undefined} result The signature, or undefined when it was cancelled.
 */
function finish(result: SignatureInput | undefined): void {
  const resolve = resolver
  resolver = undefined

  if (parts?.dialog.open) {
    parts.dialog.close()
  }

  resolve?.(result)
}

/**
 * Finds the dialog's elements and wires up its buttons, once.
 *
 * @returns {SignatureDialog} The dialog's elements.
 */
function setUp(): SignatureDialog {
  if (parts) {
    return parts
  }

  const found: SignatureDialog = {
    dialog: getElement('signature-dialog', HTMLDialogElement),
    role: getElement('sign-role', HTMLParagraphElement),
    name: getElement('sign-name', HTMLInputElement),
    error: getElement('sign-error', HTMLParagraphElement),
    pad: new SignaturePad(getElement('signature-pad', HTMLCanvasElement)),
  }

  getElement('save-signature', HTMLButtonElement).addEventListener(
    'click',
    () => {
      const name = found.name.value.trim()

      if (name === '') {
        found.error.textContent = 'Type your name first.'
        found.name.focus()
      } else if (found.pad.isEmpty) {
        found.error.textContent = 'Sign in the box first.'
      } else {
        finish({ name, image: found.pad.toDataUrl() })
      }
    },
  )
  getElement('clear-signature', HTMLButtonElement).addEventListener(
    'click',
    () => {
      found.pad.clear()
    },
  )
  getElement('cancel-sign', HTMLButtonElement).addEventListener('click', () => {
    finish(undefined)
  })
  found.dialog.addEventListener('close', () => {
    finish(undefined)
  })

  parts = found
  return found
}

/**
 * Asks someone to type their name and sign.
 *
 * @param {Signer} signer Who is signing, with the name the report has for them.
 * @returns {Promise<SignatureInput | undefined>} Their name and signature, or undefined when they cancel.
 */
function openSignatureDialog(
  signer: Signer,
): Promise<SignatureInput | undefined> {
  const { dialog, error, name, pad, role } = setUp()

  finish(undefined)
  role.textContent =
    signer.role === 'landlord'
      ? 'Signing for the landlord.'
      : 'Signing as a tenant.'
  name.value = signer.name
  error.textContent = ''
  dialog.showModal()
  pad.reset()

  const { promise, resolve } = Promise.withResolvers<
    SignatureInput | undefined
  >()
  resolver = resolve

  return promise
}

export { openSignatureDialog }
