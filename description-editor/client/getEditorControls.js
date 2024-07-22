const getEditorControls = ({
  node,
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
}) => {
  if (!document.querySelector("[editor-control-style]")) {
    const firstStyleNode = document.querySelector("style")
    const styleElement = document.createElement("style")
    styleElement.setAttribute("editor-control-style", "")
    styleElement.innerText = /* CSS */ `
      .editor-controls {
        padding: 20px;
        display: flex;
        gap: 10px;
        align-items: center;
        background: #323232;
      }
      .editor-controls-button {
        background: #2d52ce;
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
      }
      .editor-controls-button:hover {
        background: #1b40bf;
      }
      .editor-controls-button:active {
        background: #1b3695;
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
        background: #424242;
        color: #f4f4f4;
        border: 2px dashed #5a5a5a;
        cursor: default;
      }
      .editor-controls-button.done:hover, .editor-controls-button.working:hover{
        background: #424242;
      }
      .editor-controls-button.done:active, .editor-controls-button.working:active {
        background: #424242;
      }
    `
    firstStyleNode.parentNode.insertBefore(styleElement, firstStyleNode)
  }

  node.innerHTML = /* HTML */ `
    <div class="editor-controls">
      <button render-button type="button" class="editor-controls-button">
        <span label>Render</span>
      </button>
      <button save-button type="button" class="editor-controls-button">
        <span label>Save</span>
        <svg aria-hidden warning-icon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
          <!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
          <path
            d="M192 32c17.7 0 32 14.3 32 32l0 135.5 111.5-66.9c15.2-9.1 34.8-4.2 43.9 11s4.2 34.8-11 43.9L254.2 256l114.3 68.6c15.2 9.1 20.1 28.7 11 43.9s-28.7 20.1-43.9 11L224 312.5 224 448c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-135.5L48.5 379.4c-15.2 9.1-34.8 4.2-43.9-11s-4.2-34.8 11-43.9L129.8 256 15.5 187.4c-15.2-9.1-20.1-28.7-11-43.9s28.7-20.1 43.9-11L160 199.5 160 64c0-17.7 14.3-32 32-32z"
          ></path>
        </svg>
      </button>
      <button publish-button type="button" class="editor-controls-button">
        <span label>Publish</span>
        <svg aria-hidden warning-icon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
          <!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
          <path
            d="M192 32c17.7 0 32 14.3 32 32l0 135.5 111.5-66.9c15.2-9.1 34.8-4.2 43.9 11s4.2 34.8-11 43.9L254.2 256l114.3 68.6c15.2 9.1 20.1 28.7 11 43.9s-28.7 20.1-43.9 11L224 312.5 224 448c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-135.5L48.5 379.4c-15.2 9.1-34.8 4.2-43.9-11s-4.2-34.8 11-43.9L129.8 256 15.5 187.4c-15.2-9.1-20.1-28.7-11-43.9s28.7-20.1 43.9-11L160 199.5 160 64c0-17.7 14.3-32 32-32z"
          ></path>
        </svg>
      </button>
    </div>
  `

  const renderButton = node.querySelector("[render-button]")
  const saveButton = node.querySelector("[save-button]")
  const publishButton = node.querySelector("[publish-button]")

  let currentRenderedDescriptionHash

  watchAudioStatus(() => {
    const audioStatus = getAudioStatus()
    if (audioStatus === "rendering") {
      renderButton.querySelector("[label]").innerText = "Rendering..."
      renderButton.classList.add("working")
      renderButton.classList.remove("ready")
      renderButton.classList.remove("done")
    } else if (audioStatus === "done") {
      currentRenderedDescriptionHash = getDescriptionsHash()
      renderButton.querySelector("[label]").innerText = "Rendered"
      renderButton.classList.remove("working")
      renderButton.classList.remove("ready")
      renderButton.classList.add("done")
    }
  })

  onDescriptionsChange(() => {
    if (currentRenderedDescriptionHash !== getDescriptionsHash()) {
      renderButton.querySelector("[label]").innerText = "Render"
      renderButton.classList.remove("working")
      renderButton.classList.add("ready")
      renderButton.classList.remove("done")
    }
  })

  renderButton.addEventListener("click", async () => {
    await renderAudio()
  })

  let currentSavedDescriptionsHash = getDescriptionsHash()

  saveButton.addEventListener("click", async () => {
    if (getSavedContent().isDemoVideo) {
      return getModal({
        title: "Demo Video",
        body: "To save, please start a description for any video which is not the demo video.",
        actions: [{ text: "Okay", isPrimary: true }],
      })
    }

    await renderAudio()

    if (!window.user) {
      await new Promise(resolve => {
        getSignInModal({ callback: resolve })
      })
    }

    const descriptionsHash = getDescriptionsHash()

    const saveResponse = await fetch("/api/save", {
      method: "POST",
      body: JSON.stringify({
        videoId: getVideo().id,
        descriptionsHash,
        descriptions: getDescriptions(),
        captions: getAudioCaptions(),
        duckingTimes: getDuckingTimes(),
      }),
    })

    if (saveResponse.ok) {
      currentSavedDescriptionsHash = descriptionsHash
      console.log("currentSavedDescriptionsHash", currentSavedDescriptionsHash)
    }
  })

  publishButton.addEventListener("click", async () => {
    if (getSavedContent().isDemoVideo) {
      return getModal({
        title: "Demo Video",
        body: "To publish, please start a description for any video which is not the demo video.",
        actions: [{ text: "Okay", isPrimary: true }],
      })
    }

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
}
