const getEditor = async ({
  node,
  seekTo,
  getVideo,
  renderAudio,
  getAudioCaptions,
  getDuckingTimes,
  getSavedContent,
  getAudioStatus,
  watchAudioStatus,
}) => {
  const getId = () => `id${Math.random().toString().substr(2, 9)}`

  node.innerHTML = /* HTML */ `
    <style>
      #editor {
        width: 100%;
        background: #242424;
        display: flex;
        flex-direction: column;
      }
      #descriptions {
        flex-grow: 1;
        overflow-y: scroll;
        padding: 7px 0;
      }
    </style>
    <div description-gap-style-node></div>
    <div description-style-node></div>
    <div id="editor">
      <div id="descriptions"></div>

      <div editor-controls-container></div>
    </div>
  `

  const descriptionsElement = node.querySelector("#descriptions")
  const descriptionStyleNode = node.querySelector("[description-style-node]")
  const descriptionGapStyleNode = node.querySelector("[description-gap-style-node]")

  const {
    getDescriptions,
    getDescriptionsHash,
    onDescriptionsChange,
    createDescription,
    updateDescription,
    deleteDescription,
  } = await editDescriptions({ savedDescriptions: getSavedContent()?.descriptions })

  const editorControlsContainer = node.querySelector("[editor-controls-container]")
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
  })

  const getDefaultSsml = description => {
    return `<prosody rate="+40%">${description.text || "no content"}</prosody>`
  }

  let firstGapId

  const handleDescriptionsChange = () => {
    const createGapElement = ({ descriptionId = null, time = null }) => {
      const gapNode = document.createElement("div")
      getDescriptionGap({
        styleNode: descriptionGapStyleNode,
        node: gapNode,
        descriptionId,
        time,
        getDescriptions,
        createDescription,
        seekTo,
      })
      return gapNode
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

      let node
      const existingElement = descriptionsElement.querySelector(`#${description.id}`)
      if (existingElement) {
        node = existingElement
      } else {
        node = document.createElement("div")
        node.setAttribute("id", description.id)
        node.setAttribute("description-node", "")
        getDescription({
          styleNode: descriptionStyleNode,
          node,
          id: description.id,
          getDescriptions,
          updateDescription,
          deleteDescription,
          onDescriptionsChange,
          getDefaultSsml,
          firstGapId,
          seekTo,
        })
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
      if (node.contains(document.activeElement)) {
        elementRequiringFocus = document.activeElement
        selectionStart = document.activeElement.selectionStart
        selectionEnd = document.activeElement.selectionEnd
      }

      descriptionsElement.insertBefore(node, nextElement)
      descriptionsElement.insertBefore(gapNode, node.nextElementSibling)

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
