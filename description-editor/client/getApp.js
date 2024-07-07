const getApp = async () => {
  const root = document.querySelector("#root")
  root.innerHTML = /* HTML */ `
    <style>
      html,
      body {
        margin: 0;
      }
      body {
        background: black;
        color: white;
        font-family: monospace;
      }
      html,
      body,
      #root,
      #app,
      #video-player,
      #editor-container,
      #editor {
        height: 100%;
      }
      .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        border: 0 !important;
      }
      #app {
        display: flex;
        align-items: stretch;
        width: 100%;
      }
      #video-player {
        flex-grow: 1;
      }
    </style>
    <div startup-dialog-node></div>
    <div id="app">
      <div id="video-player"></div>
      <div id="editor-container"></div>
    </div>
  `

  // getStartupDialog({ node: root.querySelector("[startup-dialog-node]") })

  let renderAudioRef = { current: null }
  let getAudioElementRef = { current: null }

  const getAudioElementWhenAvailable = () => {
    if (getAudioElementRef.current) return getAudioElementRef.current()
  }

  const audioElementListeners = []

  const [{ seekTo }, { ffmpeg, fetchFile, getMostRecentDurationSeconds }] = await Promise.all([
    getVideoPlayer({
      node: root.querySelector("#video-player"),
      getVideo: () => ({ id: "2e4oRKhilhA" }),
      getAudioElement: getAudioElementWhenAvailable,
      listenForChange: callback => {
        audioElementListeners.push(callback)
      },
    }),
    getFFmpeg(),
  ])

  const { getDescriptions, getDefaultSsml } = getEditor({
    node: root.querySelector("#editor-container"),
    seekTo,
    renderAudioRef,
  })

  const { renderAudio, getAudioElement } = getAudio({
    ffmpeg,
    fetchFile,
    getMostRecentDurationSeconds,
    getDefaultSsml,
    getDescriptions,
    onAudioElementChange: () => {
      audioElementListeners.forEach(callback => callback())
    },
  })

  renderAudioRef.current = renderAudio
  getAudioElementRef.current = getAudioElement
}
