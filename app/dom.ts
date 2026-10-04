const CONFIRM_TIMEOUT = 5000

/**
 * Finds an element the page can't work without.
 *
 * @param {string} id The element's id.
 * @param {new () => T} type The element class it must be.
 * @returns {T} The element.
 */
function getElement<T extends HTMLElement>(id: string, type: new () => T): T {
  const element = document.querySelector(`#${id}`)

  if (!(element instanceof type)) {
    throw new TypeError(`The page is missing #${id}.`)
  }

  return element
}

/**
 * Copies the first element out of a template.
 *
 * @param {HTMLTemplateElement} template The template.
 * @returns {HTMLElement} A new copy of its element.
 */
function cloneTemplate(template: HTMLTemplateElement): HTMLElement {
  const element = template.content.firstElementChild?.cloneNode(true)

  if (!(element instanceof HTMLElement)) {
    throw new TypeError(`The #${template.id} template is empty.`)
  }

  return element
}

/**
 * Makes a destructive button need two clicks. The first click changes its
 * label to the text in its data-confirm attribute, and the second, within
 * five seconds, goes ahead.
 *
 * @param {HTMLButtonElement} button The button.
 * @returns {boolean} True when this click confirms, false when it only asked.
 */
function confirmClick(button: HTMLButtonElement): boolean {
  if (button.dataset.armed === 'true') {
    delete button.dataset.armed
    button.textContent = button.dataset.label ?? button.textContent
    return true
  }

  button.dataset.label = button.textContent.trim()
  button.dataset.armed = 'true'
  button.textContent = button.dataset.confirm ?? 'Click again to confirm'

  setTimeout(() => {
    if (button.dataset.armed !== 'true') {
      return
    }

    delete button.dataset.armed
    button.textContent = button.dataset.label ?? button.textContent
  }, CONFIRM_TIMEOUT)

  return false
}

export { cloneTemplate, confirmClick, getElement }
