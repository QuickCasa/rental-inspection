import { DATABASE_NAME, DATABASE_VERSION } from '../constants.js'

const INSPECTIONS = 'inspections'
const PHOTOS = 'photos'
const BY_INSPECTION = 'byInspection'

let opening: Promise<IDBDatabase> | undefined

/**
 * Waits for an IndexedDB request.
 *
 * @param {IDBRequest<T>} request The request.
 * @returns {Promise<T>} Its result.
 */
function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => {
      resolve(request.result)
    })
    request.addEventListener('error', () => {
      reject(request.error ?? new Error('The browser refused to save.'))
    })
  })
}

/**
 * Waits for a transaction to finish writing.
 *
 * @param {IDBTransaction} transaction The transaction.
 * @returns {Promise<void>} Resolves once every write is saved.
 */
function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.addEventListener('complete', () => {
      resolve()
    })
    transaction.addEventListener('error', () => {
      reject(transaction.error ?? new Error('The browser refused to save.'))
    })
    transaction.addEventListener('abort', () => {
      reject(transaction.error ?? new Error('Saving was cancelled.'))
    })
  })
}

/**
 * Opens the app's database, creating its stores on the first visit:
 * inspections, and their photos indexed by inspection. The connection is
 * opened once and shared.
 *
 * @returns {Promise<IDBDatabase>} The database.
 */
function openDatabase(): Promise<IDBDatabase> {
  opening ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

    request.addEventListener('upgradeneeded', () => {
      const database = request.result

      if (!database.objectStoreNames.contains(INSPECTIONS)) {
        database.createObjectStore(INSPECTIONS, { keyPath: 'id' })
      }

      if (!database.objectStoreNames.contains(PHOTOS)) {
        database
          .createObjectStore(PHOTOS, { keyPath: 'id' })
          .createIndex(BY_INSPECTION, 'inspectionId')
      }
    })
    request.addEventListener('success', () => {
      resolve(request.result)
    })
    request.addEventListener('error', () => {
      opening = undefined
      reject(
        request.error ?? new Error('This browser has no storage for the app.'),
      )
    })
  })

  return opening
}

export {
  BY_INSPECTION,
  INSPECTIONS,
  openDatabase,
  PHOTOS,
  requestResult,
  transactionDone,
}
