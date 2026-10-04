import { ROOM_TEMPLATES } from './constants.js'
import { createRoom } from './create-room.js'
import { deleteInspection } from './database/inspections.js'
import { confirmClick, getElement } from './dom.js'
import {
  applyLock,
  drawOpenRoom,
  openRooms,
  roomsContainer,
  setStatus,
  state,
  syncSigners,
} from './inspection-page.js'
import {
  getInspectionFileName,
  getInspectionTitle,
} from './inspection-names.js'
import { nextRoomName } from './next-room-name.js'
import {
  buildBackupBlob,
  buildReportBlob,
  downloadBlob,
} from './report-files.js'
import type { Inspection } from './types.js'

/**
 * Runs a report button's work on the open inspection, after saving it, with
 * a message if it fails. Cancelling a share isn't a failure.
 *
 * @param {(inspection: Inspection) => Promise<void>} work What the button does.
 * @param {string} failure What to say if it fails.
 * @returns {Promise<void>} Resolves once the work is done.
 */
async function runReportAction(
  work: (inspection: Inspection) => Promise<void>,
  failure: string,
): Promise<void> {
  const { current } = state

  if (!current) {
    return
  }

  await state.flush()
  setStatus('')

  try {
    await work(current)
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'AbortError')) {
      setStatus(failure)
    }
  }
}

/**
 * Adds the room chosen in the "Add a room" list, open and in view.
 */
function addRoom(): void {
  const { current } = state
  const choice = getElement('room-choice', HTMLSelectElement)
  const template = ROOM_TEMPLATES.find(entry => entry.name === choice.value)

  if (!current || !template) {
    return
  }

  const room = createRoom(
    nextRoomName(current.rooms, template.name),
    template.items,
  )
  const element = drawOpenRoom(room)

  current.rooms.push(room)
  roomsContainer.append(element)
  applyLock()
  element.querySelector('summary')?.focus()
  element.scrollIntoView({ block: 'start' })
  state.schedule()
}

/**
 * Clears every signature so the report can be edited, once confirmed.
 *
 * @param {HTMLButtonElement} button The "Edit the report" button.
 * @returns {Promise<void>} Resolves once the change is saved.
 */
async function unlock(button: HTMLButtonElement): Promise<void> {
  const { current } = state

  if (!current || !confirmClick(button)) {
    return
  }

  current.signatures = []
  await state.save()
  syncSigners()
  setStatus(
    'The signatures are cleared. Make your changes, then everyone signs again.',
  )
}

/**
 * Deletes the open inspection and its photos, once confirmed, and goes back
 * to the list.
 *
 * @param {HTMLButtonElement} button The delete button.
 * @returns {Promise<void>} Resolves once it's deleted.
 */
async function deleteCurrent(button: HTMLButtonElement): Promise<void> {
  const { current } = state

  if (!current || !confirmClick(button)) {
    return
  }

  state.current = undefined
  await deleteInspection(current.id)
  location.hash = ''
}

/**
 * Wires up the buttons outside the rooms: adding a room, unlocking, the
 * report and backup buttons and deleting, plus saving when the app goes into
 * the background.
 */
function setUpInspectionActions(): void {
  const unlockButton = getElement('unlock', HTMLButtonElement)
  const deleteButton = getElement('delete-inspection', HTMLButtonElement)
  const shareButton = getElement('share-pdf', HTMLButtonElement)

  getElement('room-choice', HTMLSelectElement).replaceChildren(
    ...ROOM_TEMPLATES.map(template => new Option(template.name, template.name)),
  )

  // <details> toggle events don't bubble, so this listens while they travel
  // down to the room.
  roomsContainer.addEventListener(
    'toggle',
    toggleEvent => {
      const { target } = toggleEvent

      if (!(target instanceof HTMLDetailsElement) || !target.dataset.roomId) {
        return
      }

      if (target.open) {
        openRooms.add(target.dataset.roomId)
      } else {
        openRooms.delete(target.dataset.roomId)
      }
    },
    { capture: true },
  )

  getElement('add-room', HTMLButtonElement).addEventListener('click', addRoom)

  unlockButton.addEventListener('click', async () => {
    await unlock(unlockButton)
  })

  deleteButton.addEventListener('click', async () => {
    await deleteCurrent(deleteButton)
  })

  getElement('download-pdf', HTMLButtonElement).addEventListener(
    'click',
    async () => {
      await runReportAction(async inspection => {
        downloadBlob(
          await buildReportBlob(inspection),
          getInspectionFileName(inspection, 'pdf'),
        )
      }, "The PDF couldn't be made. Reload the page and try again.")
    },
  )

  shareButton.hidden = !navigator.canShare?.({
    files: [new File([''], 'report.pdf', { type: 'application/pdf' })],
  })

  shareButton.addEventListener('click', async () => {
    await runReportAction(async inspection => {
      const file = new File(
        [await buildReportBlob(inspection)],
        getInspectionFileName(inspection, 'pdf'),
        { type: 'application/pdf' },
      )

      await navigator.share({
        files: [file],
        title: getInspectionTitle(inspection),
      })
    }, "The PDF couldn't be shared. Download it instead.")
  })

  getElement('save-backup', HTMLButtonElement).addEventListener(
    'click',
    async () => {
      await runReportAction(async inspection => {
        downloadBlob(
          await buildBackupBlob(inspection),
          getInspectionFileName(inspection, 'json'),
        )
      }, "The backup file couldn't be made. Reload the page and try again.")
    },
  )

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void state.flush()
    }
  })
}

export { setUpInspectionActions }
