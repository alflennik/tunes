import getDescriptionTime from "./getDescriptionTime.js"

const getDescription = ({
  styleNode,
  node,
  id,
  getDescriptions,
  deleteDescription,
  updateDescription,
  onDescriptionsChange,
  getDefaultSsml,
  firstGapId,
  seekTo,
}) => {
  if (!styleNode.hasChildNodes()) {
    styleNode.innerHTML = /* HTML */ `
      <style>
        .description {
          padding: 7px 20px;
        }
        .description textarea {
          width: 100% !important;
          background: #313131;
          border: none;
          color: white;
          height: 100px;
          font-size: 15px;
          line-height: 1.4;
          box-sizing: border-box;
          display: block;
          padding: 4px;
          border-radius: 4px;
        }
        .description-actions {
          display: flex;
          gap: 7px;
          padding: 0px 0px 7px;
        }
        .description-actions button {
          border: none;
          display: flex;
          align-items: center;
        }
        .description-actions svg {
          fill: white;
          width: 14px;
          height: 14px;
        }
        .description-actions > button {
          padding: 4px 18px;
          background: #313131;
          border-radius: 4px;
        }
        .description-provide-ssml {
          font-family: monospace;
          font-weight: bold;
          margin-bottom: 4px;
          display: block;
        }
      </style>
    `
  }

  node.innerHTML = /* HTML */ `
    <div class="description">
      <div class="description-actions">
        <button play-from-description type="button" title="Play From Here">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
            <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
            <path
              d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"
            ></path>
          </svg>
          <span class="sr-only">Play From Here</span>
        </button>
        <div description-time class="description-time"></div>
        <button description-delete class="description-delete" type="button" title="Delete">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
            <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
            <path
              d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h96l7.2-14.3zM32 128H416V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V128zm96 64c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16z"
            ></path>
          </svg>
          <span class="sr-only">Delete</span>
        </button>
      </div>
      <textarea text></textarea>
      <label class="description-provide-ssml"
        ><input provide-ssml type="checkbox" /> Provide SSML</label
      >
      <div provide-ssml-text></div>
    </div>
  `

  const getDescription = () => getDescriptions().find(description => description.id === id)

  getDescriptionTime({
    node: node.querySelector("[description-time]"),
    styleNode,
    id,
    getDescription,
    updateDescription,
    onDescriptionsChange,
  })

  const textTextarea = node.querySelector("[text]")
  textTextarea.addEventListener("input", () => {
    updateDescription({ id, text: textTextarea.value })
  })

  const ssmlCheckbox = node.querySelector("[provide-ssml]")

  const handleChange = () => {
    const description = getDescription()

    if (!description) return // It was deleted

    ssmlCheckbox.checked = description.ssml !== null

    textTextarea.value = description.text
    if (textTextarea === document.activeElement) {
      const textSelectionStart = textTextarea.selectionStart
      const textSelectionEnd = textTextarea.selectionEnd
      textTextarea.focus()
      textTextarea.setSelectionRange(textSelectionStart, textSelectionEnd)
    }

    let ssmlTextarea = node.querySelector("[provide-ssml-text]")
    if (description.ssml == null && ssmlTextarea.tagName === "TEXTAREA") {
      ssmlTextarea.outerHTML = "<div provide-ssml-text></div>"
      node.querySelector("[provide-ssml]").focus()
    } else if (description.ssml != null && ssmlTextarea.tagName === "DIV") {
      ssmlTextarea.outerHTML = "<textarea provide-ssml-text></textarea>"

      ssmlTextarea = node.querySelector("[provide-ssml-text]")

      ssmlTextarea.value = description.ssml

      ssmlTextarea.addEventListener("input", () => {
        updateDescription({ id, ssml: ssmlTextarea.value })
      })

      ssmlTextarea.focus()
    } else if (description.ssml != null && ssmlTextarea.tagName === "TEXTAREA") {
      ssmlTextarea.value = description.ssml

      if (ssmlTextarea === document.activeElement) {
        const textSelectionStart = ssmlTextarea.selectionStart
        const textSelectionEnd = ssmlTextarea.selectionEnd
        ssmlTextarea.focus()
        ssmlTextarea.setSelectionRange(textSelectionStart, textSelectionEnd)
      }
    }
  }

  onDescriptionsChange(handleChange)
  handleChange()

  const playButton = node.querySelector("[play-from-description]")
  playButton.addEventListener("click", () => {
    const description = getDescription()
    seekTo(description.time)
  })

  const deleteButton = node.querySelector("[description-delete]")
  deleteButton.addEventListener("click", () => {
    getModal({
      title: "Are you sure?",
      body: "Are you sure you want to delete this description?",
      actions: [
        {
          text: "Okay",
          isPrimary: true,
          action: () => {
            const previousId = deleteDescription(id)
            if (previousId) {
              document.querySelector(`#gap${previousId} [add-description]`).focus()
            } else {
              document.querySelector(`#${firstGapId} [add-description]`).focus()
            }
          },
        },
        {
          text: "Cancel",
          action: () => {
            deleteButton.focus()
          },
        },
      ],
    })
  })

  ssmlCheckbox.addEventListener("change", event => {
    const description = getDescription()

    if (event.target.checked) {
      updateDescription({ id, ssml: getDefaultSsml(description) })
    } else {
      const removeSsml = () => {
        // Need to show an "are you sure" dialog
        updateDescription({ id, ssml: null })
      }

      if (description.ssml !== getDefaultSsml(description)) {
        getModal({
          title: "Are you sure?",
          body: "Are you sure you want to remove your changes to the SSML?",
          actions: [
            {
              text: "Okay",
              isPrimary: true,
              action: () => {
                removeSsml()
                ssmlCheckbox.focus()
                ssmlCheckbox.removeAttribute("checked")
              },
            },
            {
              text: "Cancel",
              action: () => {
                ssmlCheckbox.focus()
                ssmlCheckbox.checked = true
              },
            },
          ],
        })
      } else {
        removeSsml()
        ssmlCheckbox.focus()
      }
    }
  })
}

export default getDescription
