import { formatTimestamp } from './format-timestamp.js'
import { getSigners } from './get-signers.js'
import type { Inspection, Signer } from './types.js'

/**
 * Draws one signature line: who signs, then their signature and when they
 * signed, or a button to sign.
 *
 * @param {Inspection} inspection The inspection.
 * @param {Signer} signer Who signs here.
 * @returns {HTMLLIElement} The line.
 */
function renderSigner(inspection: Inspection, signer: Signer): HTMLLIElement {
  const signature = inspection.signatures.find(
    entry => entry.slot === signer.slot,
  )
  const entry = document.createElement('li')
  const role = document.createElement('p')
  const name = document.createElement('p')
  const signedName = signature?.name.trim() ?? ''

  entry.className = 'signer'
  role.className = 'signer-role'
  role.textContent = signer.role === 'landlord' ? 'Landlord or agent' : 'Tenant'
  name.className = 'signer-name'
  name.textContent = signedName || signer.name || 'Name not entered yet'
  entry.append(role, name)

  if (signature) {
    const image = document.createElement('img')
    const time = document.createElement('p')

    image.className = 'signature-image'
    image.src = signature.image
    image.alt = `Signature of ${signedName}`
    time.className = 'hint'
    time.textContent = `Signed ${formatTimestamp(signature.signedAt, inspection.timeZone)}`
    entry.append(image, time)
    return entry
  }

  const button = document.createElement('button')

  button.type = 'button'
  button.className = 'button button-primary'
  button.dataset.action = 'sign'
  button.dataset.slot = signer.slot
  button.dataset.unlocked = ''
  button.textContent = 'Sign'
  button.setAttribute(
    'aria-label',
    `Sign as ${signer.name || role.textContent.toLowerCase()}`,
  )
  entry.append(button)

  return entry
}

/**
 * Draws the signature lines: the landlord or agent, then each tenant.
 *
 * @param {HTMLElement} list Where the lines go.
 * @param {Inspection} inspection The inspection.
 */
function renderSigners(list: HTMLElement, inspection: Inspection): void {
  list.replaceChildren(
    ...getSigners(inspection).map(signer => renderSigner(inspection, signer)),
  )
}

export { renderSigners }
