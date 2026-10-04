import { formatTimestamp } from '../format-timestamp.js'
import { getSigners } from '../get-signers.js'
import type { Inspection, Signer, SignerRole } from '../types.js'
import type { PdfWriter } from './pdf-writer.js'

const BLANK = '____________________'
const BLOCK_HEIGHT = 96
const SIGNATURE_WIDTH = 220
const SIGNATURE_HEIGHT = 56

const ROLE_LABELS: Readonly<Record<SignerRole, string>> = {
  landlord: 'Landlord or agent',
  tenant: 'Tenant',
}

/**
 * Writes one person's signature block: their name, then their drawn
 * signature and when they signed, or blank lines to sign by hand.
 *
 * @param {PdfWriter} writer The writer.
 * @param {Inspection} inspection The inspection.
 * @param {Signer} signer Who signs here.
 */
function writeSignature(
  writer: PdfWriter,
  inspection: Inspection,
  signer: Signer,
): void {
  const signature = inspection.signatures.find(
    entry => entry.slot === signer.slot,
  )
  const name = signature?.name.trim() || signer.name

  writer.ensureSpace(BLOCK_HEIGHT)
  writer.text(`${ROLE_LABELS[signer.role]}: ${name || BLANK}`, { bold: true })

  if (signature) {
    const height = writer.image(signature.image, 'PNG', {
      x: writer.left,
      y: writer.y + 4,
      width: SIGNATURE_WIDTH,
      height: SIGNATURE_HEIGHT,
    })

    writer.space(height + 8)
    writer.text(
      `Signed ${formatTimestamp(signature.signedAt, inspection.timeZone)}`,
      { size: 9.5, muted: true },
    )
    writer.space(14)
    return
  }

  const signatureWidth = writer.width * 0.6
  writer.signatureLine('Signature', writer.left, signatureWidth)
  writer.signatureLine(
    'Date',
    writer.left + signatureWidth + 24,
    writer.width - signatureWidth - 24,
  )
  writer.space(52)
}

/**
 * Writes the signatures, kept together on one page where they fit, so no
 * signature sits alone on a page that could be swapped out. Anyone who
 * hasn't signed in the app gets lines to sign on paper.
 *
 * @param {PdfWriter} writer The writer.
 * @param {Inspection} inspection The inspection.
 */
function writeSignatures(writer: PdfWriter, inspection: Inspection): void {
  const signers = getSigners(inspection)

  writer.ensureSpace(
    Math.min(BLOCK_HEIGHT * signers.length + 90, writer.pageHeight),
  )
  writer.heading('Signatures')
  writer.text(
    'By signing, each person confirms they took part in this inspection and have read this report, including any comments from the tenant.',
  )
  writer.space(8)

  for (const signer of signers) {
    writeSignature(writer, inspection, signer)
  }
}

export { writeSignatures }
