import createDropdownElement from "./utilities/createDropdownElement.js"
import showModal from "./utilities/showModal.js"
import { showSignInModal, showTermsModal } from "./getLoginModals.js"
import addStyle from "./utilities/addStyle.js"
import getId from "./utilities/getId.js"
import createElementHTML from "./utilities/createElementHTML.js"

const editorControlsClass = getId()

addStyle(`
  .${editorControlsClass} {
    padding: 20px;
    display: flex;
    gap: 10px;
    align-items: center;
    background: #333;
  }
  .editor-controls-button {
    background: #4b4b4b;
    color: white;
    border: none;
    font-family: monospace;
    padding: 6px 12px 4px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    border: 2px solid transparent;
    transition: background 200ms linear;
  }
  .editor-controls-button:hover {
    background: #424242;
  }
  .editor-controls-button:active {
    background: #3b3b3b;
  }
  .editor-controls-button svg {
    width: 12px;
    height: 12px;
    fill: white;
  }
  .editor-controls-button.working {
    background: gray;
  }
  .editor-controls-button.working:hover {
    background: gray;
  }
  .editor-controls-button.working:active {
    background: gray;
  }
  .editor-controls-button.done, .editor-controls-button.working {
    background: #383838;
    color: #f4f4f4;
    border: 2px dashed #444444;
    cursor: default;
  }
  .editor-controls-button.done:hover, .editor-controls-button.working:hover{
    background: #383838;
  }
  .editor-controls-button.done:active, .editor-controls-button.working:active {
    background: #383838;
  }
  .option-button-container {
    flex-grow: 1;
    display: flex;
    justify-content: end;
  }
  .option-button {
    background: #6f6f6f;
    border: none;
    height: 30px;
    padding: 0 7px;
    border-radius: 13px;
    display: inline-block;
    text-align: center;
    cursor: pointer;
    transition: background linear 200ms;
  }
  .option-button svg {
    display: block;
    fill: white;
    width: 19px;
    height: 19px;
  }
`)

const createEditorControlsElement = ({
  getDescriptionsHash,
  savedContentObservable,
  videoDataObservable,
  renderAudio,
  audioStatusObservable,
  audioCaptionsObservable,
  audioDuckingTimesObservable,
  loadVideoId,
}) => {
  const editorControlsElement = createElementHTML(`
    <div class="${editorControlsClass}">
      <button type="button" class="render-button editor-controls-button">
        <span class="label">Render</span>
      </button>
      <button type="button" class="save-button editor-controls-button">
        <span class="label">Save</span>
        <svg aria-hidden class="warning-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
          <!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
          <path
            d="M192 32c17.7 0 32 14.3 32 32l0 135.5 111.5-66.9c15.2-9.1 34.8-4.2 43.9 11s4.2 34.8-11 43.9L254.2 256l114.3 68.6c15.2 9.1 20.1 28.7 11 43.9s-28.7 20.1-43.9 11L224 312.5 224 448c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-135.5L48.5 379.4c-15.2 9.1-34.8 4.2-43.9-11s-4.2-34.8 11-43.9L129.8 256 15.5 187.4c-15.2-9.1-20.1-28.7-11-43.9s28.7-20.1 43.9-11L160 199.5 160 64c0-17.7 14.3-32 32-32z"
          ></path>
        </svg>
      </button>
      <button type="button" class="publish-button editor-controls-button">
        <span class="label">Publish</span>
        <svg aria-hidden class="warning-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
          <!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
          <path
            d="M192 32c17.7 0 32 14.3 32 32l0 135.5 111.5-66.9c15.2-9.1 34.8-4.2 43.9 11s4.2 34.8-11 43.9L254.2 256l114.3 68.6c15.2 9.1 20.1 28.7 11 43.9s-28.7 20.1-43.9 11L224 312.5 224 448c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-135.5L48.5 379.4c-15.2 9.1-34.8 4.2-43.9-11s-4.2-34.8 11-43.9L129.8 256 15.5 187.4c-15.2-9.1-20.1-28.7-11-43.9s28.7-20.1 43.9-11L160 199.5 160 64c0-17.7 14.3-32 32-32z"
          ></path>
        </svg>
      </button>
      <div class="option-button-container"></div>
    </div>
  `)

  const renderButton = editorControlsElement.querySelector(".render-button")
  const saveButton = editorControlsElement.querySelector(".save-button")
  const publishButton = editorControlsElement.querySelector(".publish-button")

  const newButtonElement = createElementHTML(`<button type="button">New</button>`)
  const openButtonElement = createElementHTML(`<button type="button">Open</button>`)
  const shareButtonElement = createElementHTML(`<button type="button">Share</button>`)
  const deleteButtonElement = createElementHTML(`<button type="button">Delete</button>`)
  const signOutButtonElement = createElementHTML(`<button type="button">Sign Out</button>`)

  newButtonElement.addEventListener("click", async () => {
    await loadVideoId("cXmYNmQ4BuM")
  })

  const optionButtonContainer = editorControlsElement.querySelector(".option-button-container")

  const { dropdownElement } = createDropdownElement({
    items: [
      { buttonElement: newButtonElement },
      { buttonElement: openButtonElement },
      { buttonElement: shareButtonElement },
      { buttonElement: deleteButtonElement },
      { buttonElement: signOutButtonElement },
    ],
    buttonElement: createElementHTML(`
      <button type="button" title="Options" class="option-button">
        <svg aria-hidden xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 512">
          <!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
          <path
            d="M64 360a56 56 0 1 0 0 112 56 56 0 1 0 0-112zm0-160a56 56 0 1 0 0 112 56 56 0 1 0 0-112zM120 96A56 56 0 1 0 8 96a56 56 0 1 0 112 0z"
          />
        </svg>
        <span class="sr-only">Options</span>
      </button>
    `),
  })

  optionButtonContainer.replaceChildren(dropdownElement)

  let currentRenderedDescriptionHash

  audioStatusObservable.onChange(() => {
    const audioStatus = audioStatusObservable.getValue()
    if (audioStatus === "rendering") {
      renderButton.querySelector(".label").innerText = "Rendering..."
      renderButton.classList.add("working")
      renderButton.classList.remove("ready")
      renderButton.classList.remove("done")
    } else if (audioStatus === "done") {
      currentRenderedDescriptionHash = getDescriptionsHash()
      renderButton.querySelector(".label").innerText = "Rendered"
      renderButton.classList.remove("working")
      renderButton.classList.remove("ready")
      renderButton.classList.add("done")
    }
  })

  savedContentObservable.onChange(() => {
    if (currentRenderedDescriptionHash !== getDescriptionsHash()) {
      renderButton.querySelector(".label").innerText = "Render"
      renderButton.classList.remove("working")
      renderButton.classList.add("ready")
      renderButton.classList.remove("done")
    }
    const { isDemoVideo } = savedContentObservable.getValue()
    if (isDemoVideo) {
      saveButton.querySelector(".warning-icon").style.display = "none"
      publishButton.querySelector(".warning-icon").style.display = "none"
    }
  })

  const handleUserChange = () => {
    const { isDemoVideo } = savedContentObservable.getValue()
    if (window.user || isDemoVideo) {
      saveButton.querySelector(".warning-icon").style.display = "none"
    } else {
      saveButton.querySelector(".warning-icon").style.display = "block"
    }
  }

  window.userListeners.push(handleUserChange)
  handleUserChange()

  renderButton.addEventListener("click", async () => {
    await renderAudio()
  })

  let currentSavedDescriptionsHash = getDescriptionsHash()

  saveButton.addEventListener("click", async () => {
    if (savedContentObservable.getValue().isDemoVideo) {
      return showModal({
        title: "Demo Video",
        body: "To save, please start a description for any video which is not the demo video.",
        actions: [{ text: "Okay", isPrimary: true }],
      })
    }

    await renderAudio()

    if (!window.user) {
      await new Promise(resolve => {
        showSignInModal({ callback: resolve })
      })
    }

    const descriptionsHash = getDescriptionsHash()

    const saveResponse = await fetch("/api/save", {
      method: "POST",
      body: JSON.stringify({
        videoId: videoDataObservable.getValue().id,
        descriptionsHash,
        descriptions: savedContentObservable.getValue().descriptions,
        captions: audioCaptionsObservable.getValue(),
        duckingTimes: audioDuckingTimesObservable.getValue(),
      }),
    })

    if (saveResponse.ok) {
      currentSavedDescriptionsHash = descriptionsHash
      console.log("currentSavedDescriptionsHash", currentSavedDescriptionsHash)
    }
  })

  publishButton.addEventListener("click", async () => {
    if (savedContentObservable.getValue().isDemoVideo) {
      return showModal({
        title: "Demo Video",
        body: "To publish, please start a description for any video which is not the demo video.",
        actions: [{ text: "Okay", isPrimary: true }],
      })
    }

    await renderAudio()
    if (!window.user) {
      await new Promise(resolve => {
        showSignInModal({ callback: resolve })
      })
    }
    if (window.user) {
      showTermsModal()
    }
  })

  return { editorControlsElement }
}

export default createEditorControlsElement
