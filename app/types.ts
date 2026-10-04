import type { SignaturePad } from './signature-pad.js'

type InspectionKind = 'move-in' | 'move-out' | 'routine'

/**
 * How an item looks. An empty string means nobody has rated it yet.
 */
type Condition = '' | 'good' | 'fair' | 'poor' | 'not-applicable'

type SignerRole = 'landlord' | 'tenant'

/**
 * What an item looked like in the inspection a move-out is compared with.
 */
interface ItemBaseline {
  condition: Condition
  notes: string
  photoCount: number
}

interface InspectionItem {
  /**
   * Stable across edits, so a re-render keeps each item's inputs in place.
   */
  id: string
  name: string
  condition: Condition
  notes: string
  /**
   * Photos are stored apart from the inspection, because they're large.
   */
  photoIds: string[]
  baseline: ItemBaseline | null
}

interface Room {
  id: string
  name: string
  items: InspectionItem[]
}

/**
 * The inspection a move-out was started from.
 */
interface Baseline {
  id: string
  kind: InspectionKind
  date: string
  keys: string
}

interface Signature {
  /**
   * Which signature line this is: "landlord", or "tenant-" and the tenant's
   * position in the list.
   */
  slot: string
  role: SignerRole
  name: string
  /**
   * The drawn signature, as a PNG data URL.
   */
  image: string
  /**
   * When it was signed, as an ISO 8601 timestamp.
   */
  signedAt: string
}

interface Inspection {
  id: string
  kind: InspectionKind
  address: string
  /**
   * The day of the walk-through, as YYYY-MM-DD.
   */
  date: string
  landlord: string
  /**
   * One name per line.
   */
  tenants: string
  keys: string
  meters: string
  notes: string
  tenantComments: string
  rooms: Room[]
  signatures: Signature[]
  baseline: Baseline | null
  /**
   * The IANA time zone the inspection was started in. Every time in the
   * report is shown in it, so a report reads the same on any device.
   */
  timeZone: string
  createdAt: string
  updatedAt: string
}

/**
 * A photo as the browser stores it.
 */
interface PhotoRecord {
  id: string
  inspectionId: string
  blob: Blob
  width: number
  height: number
  addedAt: string
}

/**
 * A photo's JPEG bytes, for a PDF or a backup file.
 */
interface PhotoData {
  id: string
  bytes: Uint8Array
  width: number
  height: number
  addedAt: string
}

/**
 * Photos by id, as the PDF builder reads them.
 */
type PhotoMap = ReadonlyMap<string, PhotoData>

/**
 * A photo scaled down on the device, ready to store.
 */
interface ResizedPhoto {
  blob: Blob
  width: number
  height: number
}

/**
 * Someone who signs the report.
 */
interface Signer {
  slot: string
  role: SignerRole
  name: string
}

/**
 * An inspection and its photos, as saved in a backup file.
 */
interface Backup {
  inspection: Inspection
  photos: PhotoData[]
}

/**
 * An item worth calling out at the top of the report: one in worse condition
 * than at move-in, or one rated poor.
 */
interface FlaggedItem {
  room: string
  item: string
  before: Condition
  after: Condition
  notes: string
}

/**
 * How many of a room's items are rated, and how many are poor.
 */
interface RoomProgress {
  rated: number
  total: number
  poor: number
}

/**
 * A room that can be added, with the items it starts with.
 */
interface RoomTemplate {
  name: string
  items: readonly string[]
}

/**
 * A photo in the report, numbered in the order it appears.
 */
interface NumberedPhoto {
  number: number
  itemId: string
  room: string
  item: string
  photo: PhotoData
}

/**
 * Anything JSON.parse can return. Saved inspections and backup files are read
 * as this, then checked field by field before the app trusts them.
 */
type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

type JsonObject = { [key: string]: JsonValue }

/**
 * How the PDF writer sets a block of text.
 */
interface PdfTextOptions {
  size?: number
  bold?: boolean
  muted?: boolean
  /**
   * Where the text starts, in points from the left edge.
   */
  x?: number
  /**
   * How wide it can run before wrapping.
   */
  width?: number
}

/**
 * A rectangle on a PDF page, in points from the top left corner.
 */
interface PdfBox {
  x: number
  y: number
  width: number
  height: number
}

/**
 * One cell of a table row in the PDF.
 */
interface PdfCell {
  text: string
  width: number
  bold?: boolean
  muted?: boolean
}

type InspectionTextField =
  | 'address'
  | 'date'
  | 'landlord'
  | 'tenants'
  | 'keys'
  | 'meters'
  | 'notes'
  | 'tenantComments'

/**
 * The page templates the room editor draws from.
 */
interface EditorTemplates {
  room: HTMLTemplateElement
  item: HTMLTemplateElement
}

/**
 * What someone chose in the photo dialog.
 */
type PhotoChoice = 'close' | 'remove'

/**
 * The signature dialog's elements, found the first time it opens.
 */
interface SignatureDialog {
  dialog: HTMLDialogElement
  role: HTMLParagraphElement
  name: HTMLInputElement
  error: HTMLParagraphElement
  pad: SignaturePad
}

/**
 * What someone entered in the signature dialog.
 */
interface SignatureInput {
  name: string
  image: string
}

/**
 * A table row split into lines: each cell's lines, and the most lines any
 * cell has.
 */
interface WrappedRow {
  wrapped: string[][]
  lineCount: number
}

/**
 * A field on the inspection form.
 */
type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

/**
 * A room on the page: its element and the room itself.
 */
interface RoomLocation {
  element: HTMLElement
  room: Room
}

/**
 * An item on the page: its element, its room and the item itself.
 */
interface ItemLocation {
  element: HTMLElement
  room: Room
  item: InspectionItem
}

export type {
  Backup,
  Baseline,
  Condition,
  EditorTemplates,
  FlaggedItem,
  FormControl,
  Inspection,
  InspectionItem,
  InspectionKind,
  InspectionTextField,
  ItemBaseline,
  ItemLocation,
  JsonObject,
  JsonValue,
  NumberedPhoto,
  PdfBox,
  PdfCell,
  PdfTextOptions,
  PhotoChoice,
  PhotoData,
  PhotoMap,
  PhotoRecord,
  ResizedPhoto,
  Room,
  RoomLocation,
  RoomProgress,
  RoomTemplate,
  Signature,
  SignatureDialog,
  SignatureInput,
  Signer,
  SignerRole,
  WrappedRow,
}
