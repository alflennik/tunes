import editDescriptions from "./editDescriptions.js"
import createEditorControlsElement from "./createEditorControlsElement.js"
import createDescriptionGapElement from "./createDescriptionGapElement.js"
import createDescriptionElement from "./createDescriptionElement.js"
import addStyle from "./utilities/addStyle.js"
import getId from "./utilities/getId.js"
import createElementHTML from "./utilities/createElementHTML.js"

const editorClass = getId()

addStyle(`
  .${editorClass} {
    width: 100%;
    height: 100%;
    background: #242424;
    display: flex;
    flex-direction: column;

    .descriptions {
      height: 100%;
      flex-grow: 1;
      overflow-y: scroll;
      padding: 7px 0;
    }
  }
`)

const createEditorElement = async ({
  seekTo,
  videoDataObservable,
  savedContentObservable,
  savedContentMutable,
  renderAudio,
  audioStatusObservable,
  audioCaptionsObservable,
  audioDuckingTimesObservable,
  loadVideoId,
}) => {
  const getId = () => `id${Math.random().toString().substr(2, 9)}`

  const editorElement = createElementHTML(`
    <div class="${editorClass}">
      <div class="descriptions"></div>
      <div class="controls-container"></div>
    </div>
  `)

  const descriptionsElement = editorElement.querySelector(".descriptions")

  const { getDescriptionsHash, createDescription, updateDescription, deleteDescription } =
    await editDescriptions({
      savedContentMutable,
    })

  const editorControlsContainer = editorElement.querySelector(".controls-container")
  const { editorControlsElement } = createEditorControlsElement({
    getDescriptionsHash,
    savedContentObservable,
    videoDataObservable,
    renderAudio,
    audioStatusObservable,
    audioCaptionsObservable,
    audioDuckingTimesObservable,
    loadVideoId,
  })
  editorControlsContainer.replaceChildren(editorControlsElement)

  let firstGapId

  savedContentObservable.onChange(() => {
    const createGapElement = ({ descriptionId = null, time = null }) => {
      const { descriptionGapElement } = createDescriptionGapElement({
        descriptionId,
        time,
        savedContentObservable,
        createDescription,
        seekTo,
      })
      return descriptionGapElement
    }

    if (!descriptionsElement.firstElementChild) {
      const gapElement = createGapElement({ time: 0 })
      firstGapId = `gap${getId()}`
      gapElement.setAttribute("id", firstGapId)
      descriptionsElement.insertBefore(gapElement, descriptionsElement.firstElementChild)
    }

    const descriptions = savedContentObservable.getValue().descriptions

    descriptions.forEach((description, index) => {
      const previousDescription = descriptions[index - 1]
      const previousElement = previousDescription
        ? descriptionsElement.querySelector(`#gap${previousDescription.id}`)
        : descriptionsElement.firstElementChild
      const nextElement = previousElement ? previousElement.nextElementSibling : null

      let descriptionElement
      const existingElement = descriptionsElement.querySelector(`#${description.id}`)
      if (existingElement) {
        descriptionElement = existingElement
      } else {
        const { descriptionElement: newDescriptionElement } = createDescriptionElement({
          id: description.id,
          savedContentObservable,
          updateDescription,
          deleteDescription,
          getDefaultSsml,
          firstGapId,
          seekTo,
        })
        descriptionElement = newDescriptionElement
      }

      let gapElement
      const existingGapElement = descriptionsElement.querySelector(`#gap${description.id}`)
      if (existingGapElement) {
        gapElement = existingGapElement
      } else {
        gapElement = createGapElement({ descriptionId: description.id })
        gapElement.setAttribute("id", `gap${description.id}`)
      }

      let elementRequiringFocus
      let selectionStart
      let selectionEnd
      if (descriptionElement.contains(document.activeElement)) {
        elementRequiringFocus = document.activeElement
        selectionStart = document.activeElement.selectionStart
        selectionEnd = document.activeElement.selectionEnd
      }

      descriptionsElement.insertBefore(descriptionElement, nextElement)
      descriptionsElement.insertBefore(gapElement, descriptionElement.nextElementSibling)

      if (elementRequiringFocus) {
        elementRequiringFocus.focus()
        if (selectionStart) {
          elementRequiringFocus.setSelectionRange(selectionStart, selectionEnd)
        }
      }
    })

    let lastElement
    const id = descriptions[descriptions.length - 1] && descriptions[descriptions.length - 1].id
    if (id) {
      lastElement = editorElement.querySelector(`#gap${id}`)
    } else {
      lastElement = editorElement.querySelector(`#${firstGapId}`)
    }

    while (lastElement.nextElementSibling) {
      lastElement.nextElementSibling.remove()
    }
  })

  const preventLeave = event => {
    if (
      currentSavedDescriptionsHash !== getDescriptionsHash() &&
      !savedContentObservable.getValue().isDemoVideo
    ) {
      event.preventDefault()
      event.returnValue = true
    }
  }
  window.addEventListener("beforeunload", preventLeave)

  return { editorElement }
}

const getDefaultSsml = description => {
  return `<prosody rate="+40%">${description.text || "no content"}</prosody>`
}

export default createEditorElement
export { getDefaultSsml }
