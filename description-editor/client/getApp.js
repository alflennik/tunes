const getApp = async () => {
  if (location.href.endsWith("/?/sign-in-with-github")) {
    getSignInPage()
    return
  } else if (location.href.endsWith("/?/signed-in-with-github")) {
    getSignedInPage()
    return
  }

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
      #editor-container {
        width: 440px;
      }
      #video-player {
        width: calc(100% - 440px);
      }
    </style>
    <div startup-dialog-node></div>
    <div id="app">
      <div id="video-player"></div>
      <div id="editor-container"></div>
    </div>
  `

  const videoId = "2e4oRKhilhA"

  const videoDataResponse = await fetch(`/api/video-data?videoId=${videoId}`)
  const videoData = await videoDataResponse.json()

  // getStartupDialog({ node: root.querySelector("[startup-dialog-node]") })

  let audioRef = { current: null }

  const getAudioElementWhenAvailable = () => {
    if (audioRef.current) return audioRef.current.getAudioElement()
  }

  const getAudioCaptionsWhenAvailable = () => {
    if (audioRef.current) return audioRef.current.getAudioCaptions()
  }

  const getDuckingTimesWhenAvailable = () => {
    if (audioRef.current) return audioRef.current.getDuckingTimes()
  }

  const renderAudioWhenAvailable = () => {
    if (audioRef.current) return audioRef.current.renderAudio()
  }

  const audioElementListeners = []

  const [{ seekTo }, { ffmpeg, fetchFile, getMostRecentDurationSeconds }] = await Promise.all([
    getVideoPlayer({
      node: root.querySelector("#video-player"),
      getVideo: () => videoData,
      getAudioElement: getAudioElementWhenAvailable,
      getCaptions: getAudioCaptionsWhenAvailable,
      getDuckingTimes: getDuckingTimesWhenAvailable,
      listenForChange: callback => {
        audioElementListeners.push(callback)
      },
    }),
    getFFmpeg(),
    (async () => {
      const response = await fetch("/api/user")
      const user = await response.json()
      if (user) {
        window.user = user
      }
      window.userListeners = []
    })(),
  ])

  const { getDescriptions, getDefaultSsml } = getEditor({
    node: root.querySelector("#editor-container"),
    seekTo,
    renderAudio: renderAudioWhenAvailable,
  })

  const { renderAudio, getAudioElement, getAudioCaptions, getDuckingTimes } = getAudio({
    ffmpeg,
    fetchFile,
    getMostRecentDurationSeconds,
    getDefaultSsml,
    getDescriptions,
    onAudioElementChange: () => {
      audioElementListeners.forEach(callback => callback())
    },
  })

  audioRef.current = { renderAudio, getAudioElement, getAudioCaptions, getDuckingTimes }
}
