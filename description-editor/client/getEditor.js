import editDescriptions from "./editDescriptions.js"
import getEditorControls from "./getEditorControls.js"
import getDescriptionGap from "./getDescriptionGap.js"
import getDescription from "./getDescription.js"
import addStyle from "./utilities/addStyle.js"
import getId from "./utilities/getId.js"

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

const getEditor = async ({
  node,
  seekTo,
  getVideo,
  renderAudio,
  getAudioCaptions,
  getDuckingTimes,
  getSavedContent,
  onSavedContentChange,
  getAudioStatus,
  watchAudioStatus,
  loadVideoId,
}) => {
  const getId = () => `id${Math.random().toString().substr(2, 9)}`

  node.innerHTML = /* HTML */ `
    <div class="${editorClass}">
      <div class="descriptions"></div>
      <div class="controls-container"></div>
    </div>
  `

  const descriptionsElement = node.querySelector(".descriptions")

  const {
    getDescriptions,
    getDescriptionsHash,
    onDescriptionsChange,
    createDescription,
    updateDescription,
    deleteDescription,
  } = await editDescriptions({
    getSavedDescriptions: () => getSavedContent().descriptions,
    savedDescriptionsOnChange: onSavedContentChange,
  })

  const editorControlsContainer = node.querySelector(".controls-container")
  getEditorControls({
    node: editorControlsContainer,
    renderAudio,
    getAudioStatus,
    watchAudioStatus,
    getDescriptionsHash,
    getSavedContent,
    getVideo,
    getDescriptions,
    getAudioCaptions,
    getDuckingTimes,
    onDescriptionsChange,
    loadVideoId,
  })

  const getDefaultSsml = description => {
    return `<prosody rate="+40%">${description.text || "no content"}</prosody>`
  }

  let firstGapId

  const handleDescriptionsChange = () => {
    const createGapElement = ({ descriptionId = null, time = null }) => {
      const { descriptionGapElement } = getDescriptionGap({
        descriptionId,
        time,
        getDescriptions,
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

    const descriptions = getDescriptions()

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
        const { descriptionElement: newDescriptionElement } = getDescription({
          id: description.id,
          getDescriptions,
          updateDescription,
          deleteDescription,
          onDescriptionsChange,
          getDefaultSsml,
          firstGapId,
          seekTo,
        })
        descriptionElement = newDescriptionElement
      }

      let gapNode
      const existingGapNode = descriptionsElement.querySelector(`#gap${description.id}`)
      if (existingGapNode) {
        gapNode = existingGapNode
      } else {
        gapNode = createGapElement({ descriptionId: description.id })
        gapNode.setAttribute("id", `gap${description.id}`)
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
      descriptionsElement.insertBefore(gapNode, descriptionElement.nextElementSibling)

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
      lastElement = node.querySelector(`#gap${id}`)
    } else {
      lastElement = node.querySelector(`#${firstGapId}`)
    }

    while (lastElement.nextElementSibling) {
      lastElement.nextElementSibling.remove()
    }
  }

  handleDescriptionsChange()

  onDescriptionsChange(handleDescriptionsChange)

  const preventLeave = event => {
    if (currentSavedDescriptionsHash !== getDescriptionsHash() && !getSavedContent().isDemoVideo) {
      event.preventDefault()
      event.returnValue = true
    }
  }
  window.addEventListener("beforeunload", preventLeave)

  return { getDescriptions, getDefaultSsml }
}

export default getEditor
