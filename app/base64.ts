const CHUNK_SIZE = 0x80_00

/**
 * Encodes bytes as base64, in chunks so a large photo doesn't overflow the
 * call stack.
 *
 * @param {Uint8Array} bytes The bytes.
 * @returns {string} The base64 text.
 */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''

  for (let start = 0; start < bytes.length; start += CHUNK_SIZE) {
    binary += String.fromCodePoint(...bytes.subarray(start, start + CHUNK_SIZE))
  }

  return btoa(binary)
}

/**
 * Decodes base64 text into bytes.
 *
 * @param {string} base64 The base64 text.
 * @returns {Uint8Array | undefined} The bytes, or undefined when the text isn't base64.
 */
function base64ToBytes(base64: string): Uint8Array | undefined {
  let binary: string

  try {
    binary = atob(base64)
  } catch {
    return undefined
  }

  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.codePointAt(index) ?? 0
  }

  return bytes
}

export { base64ToBytes, bytesToBase64 }
