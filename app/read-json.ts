import type { JsonObject, JsonValue } from './types.js'

/**
 * Narrows a JSON value to an object.
 *
 * @param {JsonValue | undefined} value The value.
 * @returns {JsonObject} The object, or an empty one when the value isn't an object.
 */
function asObject(value: JsonValue | undefined): JsonObject {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value
  }

  return {}
}

/**
 * Narrows a JSON value to an array.
 *
 * @param {JsonValue | undefined} value The value.
 * @returns {JsonValue[]} The array, or an empty one when the value isn't an array.
 */
function asArray(value: JsonValue | undefined): JsonValue[] {
  return Array.isArray(value) ? value : []
}

/**
 * Reads a string field.
 *
 * @param {JsonObject} source The object to read from.
 * @param {string} key The field.
 * @returns {string} The value, or an empty string when it isn't a string.
 */
function readString(source: JsonObject, key: string): string {
  const value = source[key]
  return typeof value === 'string' ? value : ''
}

/**
 * Reads a whole number field that can't be negative.
 *
 * @param {JsonObject} source The object to read from.
 * @param {string} key The field.
 * @returns {number} The value, or 0 when it isn't such a number.
 */
function readCount(source: JsonObject, key: string): number {
  const value = source[key]
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
    ? value
    : 0
}

/**
 * Reads a field that must be one of a fixed set of strings.
 *
 * @param {JsonObject} source The object to read from.
 * @param {string} key The field.
 * @param {readonly T[]} allowed The values it may take. The first is the fallback.
 * @returns {T} The value, or the fallback.
 */
function readChoice<T extends string>(
  source: JsonObject,
  key: string,
  allowed: readonly T[],
): T {
  const value = source[key]
  const match = allowed.find(option => option === value)
  return match ?? (allowed[0] as T)
}

/**
 * Reads a timestamp field.
 *
 * @param {JsonObject} source The object to read from.
 * @param {string} key The field.
 * @returns {string} The timestamp in ISO 8601 form, or an empty string when it isn't a valid time.
 */
function readTimestamp(source: JsonObject, key: string): string {
  const time = Date.parse(readString(source, key))
  return Number.isNaN(time) ? '' : new Date(time).toISOString()
}

export { asArray, asObject, readChoice, readCount, readString, readTimestamp }
