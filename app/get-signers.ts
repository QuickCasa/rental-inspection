import { splitLines } from './split-lines.js'
import type { Inspection, Signer } from './types.js'

/**
 * Lists who signs the report: the landlord or their agent, then each tenant.
 * With no tenants listed there's still one tenant line, so the report can
 * always be signed by both sides.
 *
 * @param {Inspection} inspection The inspection.
 * @returns {Signer[]} The signers, in the order they appear in the report.
 */
function getSigners(inspection: Inspection): Signer[] {
  const tenants = splitLines(inspection.tenants)
  const tenantNames = tenants.length > 0 ? tenants : ['']

  return [
    { slot: 'landlord', role: 'landlord', name: inspection.landlord.trim() },
    ...tenantNames.map((name, index) => ({
      slot: `tenant-${String(index)}`,
      role: 'tenant' as const,
      name,
    })),
  ]
}

export { getSigners }
