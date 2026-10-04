import { getSigners } from './get-signers.js'
import type { Inspection } from './types.js'

/**
 * Says how far along the signing is, for the list of inspections.
 *
 * @param {Inspection} inspection The inspection.
 * @returns {string} Such as "Not signed yet" or "Signed by 2 of 3".
 */
function describeSignatures(inspection: Inspection): string {
  const signers = getSigners(inspection)
  const signed = signers.filter(signer =>
    inspection.signatures.some(signature => signature.slot === signer.slot),
  ).length

  if (signed === 0) {
    return 'Not signed yet'
  }

  if (signed === signers.length) {
    return 'Signed by everyone'
  }

  return `Signed by ${String(signed)} of ${String(signers.length)}`
}

export { describeSignatures }
