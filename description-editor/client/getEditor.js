const getEditor = ({ node }) => {
  const getId = () => `id${Math.random().toString().substr(2, 9)}`

  node.innerHTML = /* HTML */ `
    <style>
      #editor {
        width: 440px;
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
      .save-and-render {
        background: #2d52ce;
        color: white;
        border: none;
        font-family: monospace;
        padding: 9px 15px 6px;
        border-radius: 4px;
        cursor: pointer;
      }
      .save-and-render:hover {
        background: #1b40bf;
      }
      .save-and-render:active {
        background: #1b3695;
      }
      .save-and-render svg {
        width: 14px;
        height: 14px;
        fill: white;
      }
      .publish-button {
        color: white;
        background: #333;
        border: none;
        cursor: pointer;
        padding: 6px 12px;
        font-family: monospace;
        border-radius: 4px;
        border: 2px dashed #5b5b5b;
        font-weight: bold;
        transition: background 200ms;
      }
      .publish-button:hover {
        background: #222;
      }
      .publish-button:active {
        background: #111;
      }
    </style>
    <div description-gap-style-node></div>
    <div description-style-node></div>
    <div id="editor">
      <div id="descriptions"></div>

      <div id="actions">
        <button type="button" class="save-and-render">Save and Render</button>
        <button type="button" class="publish-button">Unpublished</button>
      </div>
    </div>
  `

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
          firstGapId,
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

  window.addEventListener("beforeunload", preventLeave)
}
