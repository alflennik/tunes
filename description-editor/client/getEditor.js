const getEditor = ({ node, seekTo, getVideo, renderAudio, getAudioCaptions, getDuckingTimes }) => {
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
      #actions {
        padding: 20px;
        display: flex;
        gap: 10px;
        align-items: center;
        background: #323232;
      }
      .action-button {
        background: #2d52ce;
        color: white;
        border: none;
        font-family: monospace;
        padding: 9px 15px 6px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .action-button:hover {
        background: #1b40bf;
      }
      .action-button:active {
        background: #1b3695;
      }
      .action-button svg {
        width: 9px;
        height: 9px;
        fill: white;
      }
    </style>
    <div description-gap-style-node></div>
    <div description-style-node></div>
    <div id="editor">
      <div id="descriptions"></div>

      <div id="actions">
        <button render-button type="button" class="action-button">Render</button>
        <button save-button type="button" class="action-button">
          Save
          <svg aria-hidden warning-icon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
            <path
              d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-352a96 96 0 1 1 0 192 96 96 0 1 1 0-192z"
            />
          </svg>
        </button>
        <button publish-button type="button" class="action-button">
          Publish
          <svg aria-hidden warning-icon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
            <path
              d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-352a96 96 0 1 1 0 192 96 96 0 1 1 0-192z"
            />
          </svg>
        </button>
      </div>
    </div>
  `

  const renderButton = node.querySelector("[render-button]")
  const saveButton = node.querySelector("[save-button]")
  const publishButton = node.querySelector("[publish-button]")

  const descriptionsElement = node.querySelector("#descriptions")
  const descriptionStyleNode = node.querySelector("[description-style-node]")
  const descriptionGapStyleNode = node.querySelector("[description-gap-style-node]")

  const {
    getDescriptions,
    onDescriptionsChange,
    createDescription,
    updateDescription,
    deleteDescription,
  } = editDescriptions()

  const getDefaultSsml = description => {
    return `<prosody rate="+40%">${description.text}</prosody>`
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
    event.preventDefault()
    event.returnValue = true
  }

  renderButton.addEventListener("click", () => {
    renderAudio()
  })

  saveButton.addEventListener("click", async () => {
    await renderAudio()

    if (!window.user) {
      await new Promise(resolve => {
        getSignInModal({ callback: resolve })
      })
    }

    await fetch("/api/save", {
      method: "POST",
      body: JSON.stringify({
        videoId: getVideo().id,
        descriptions: getDescriptions(),
        captions: getAudioCaptions(),
        duckingTimes: getDuckingTimes(),
      }),
    })
  })

  publishButton.addEventListener("click", async () => {
    await renderAudio()
    if (!window.user) {
      await new Promise(resolve => {
        getSignInModal({ callback: resolve })
      })
    }
    if (window.user) {
      getTermsModal()
    }
  })

  const handleUserChange = () => {
    if (window.user) {
      saveButton.querySelector("[warning-icon]").style.display = "none"
    } else {
      saveButton.querySelector("[warning-icon]").style.display = "block"
    }
  }

  window.userListeners.push(handleUserChange)
  handleUserChange()

  window.addEventListener("beforeunload", preventLeave)

  return { getDescriptions, getDefaultSsml }
}
