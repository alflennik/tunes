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
        overflow: hidden;
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

  const demoVideoId = "pCh3Kp6qxo8"
  let videoId = location.href.match(/\?.*videoId=([^&]+)/)?.[1]
  if (!videoId) videoId = demoVideoId

  const [videoData, savedContent] = await Promise.all([
    fetch(`/api/video-data?videoId=${videoId}`).then(videoDataResponse => videoDataResponse.json()),
    (async () => {
      if (videoId === demoVideoId) return getDemoData()
      return fetch(`/api/load?videoId=${videoId}`).then(savedResponse => savedResponse.json())
    })(),
  ])

  const getVideo = () => videoData

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

  const getAudioStatusWhenAvailable = () => {
    if (audioRef.current) return audioRef.current.getAudioStatus()
  }

  const audioElementListeners = []
  const audioStatusListeners = []

  const [{ seekTo }, { ffmpeg, fetchFile, getMostRecentDurationSeconds }] = await Promise.all([
    getVideoPlayer({
      node: root.querySelector("#video-player"),
      getVideo,
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

  const { getDescriptions, getDefaultSsml } = await getEditor({
    node: root.querySelector("#editor-container"),
    seekTo,
    getVideo,
    getAudioCaptions: getAudioCaptionsWhenAvailable,
    getDuckingTimes: getDuckingTimesWhenAvailable,
    renderAudio: renderAudioWhenAvailable,
    getAudioStatus: getAudioStatusWhenAvailable,
    getSavedContent: () => savedContent,
    watchAudioStatus: callback => {
      audioStatusListeners.push(callback)
    },
  })

  const { renderAudio, getAudioElement, getAudioCaptions, getDuckingTimes, getAudioStatus } =
    getAudio({
      ffmpeg,
      fetchFile,
      getMostRecentDurationSeconds,
      getDefaultSsml,
      getDescriptions,
      onAudioElementChange: () => {
        audioElementListeners.forEach(callback => callback())
      },
      onAudioStatusChange: () => {
        audioStatusListeners.forEach(callback => callback())
      },
    })

  audioRef.current = {
    renderAudio,
    getAudioElement,
    getAudioCaptions,
    getDuckingTimes,
    getAudioStatus,
  }

  await renderAudio()
}

const getDemoData = () => {
  return {
    isDemoVideo: true,
    videoId: "pCh3Kp6qxo8",
    descriptions: [
      {
        id: "id4304345",
        time: 0.6,
        text: "Have you ever thought about how blind people watch videos?",
        ssml: null,
      },
      {
        id: "id8765895",
        time: 7.3,
        text: "Since they may not be able to see the video, there needs to be a voice track describing what is happening.",
        ssml: null,
      },
      {
        id: "id3339582",
        time: 16.4,
        text: "For example, right now a boy is collecting flowers in the forest, happening across a crashed UFO and its beautiful inhabitant.",
        ssml: null,
      },
      {
        id: "id4759510",
        time: 28.2,
        text: "The boy tries to hide behind a tree but his curiosity overpowers him. It isn't long before she notices him.",
        ssml: null,
      },
      {
        id: "id3894014",
        time: 38.2,
        text: "She stands before him. He holds out a trembling hand to shake. She has no concept of this.",
        ssml: null,
      },
      {
        id: "id5395692",
        time: 44,
        text: "With a sneeze, she transforms from one beautiful form to another. She transforms, from the K-Pop idol Minnie, to the K-Pop idol Mi-yeon. They are both members of (G)I-DLE.",
        ssml: '<prosody rate="+25%">\n  With a sneeze, she transforms from one beautiful form to another.\n  <break time="500ms" />\n  She transforms, from the K-Pop idol Minnie\n</prosody>\n<prosody rate="+25%">to the K-Pop idol</prosody>\n<prosody rate="-10%">Mi-yeon.</prosody>\n<prosody rate="+30%">They are both members of G-Idle.</prosody>',
      },
      {
        id: "id5222019",
        time: 62.1,
        text: "Starting to get the idea? Why don't you give it a go?",
        ssml: null,
      },
    ],
    captions: [
      {
        text: "Have you ever thought about how blind people watch videos?",
        time: 0.6,
        timeEnd: 3.39,
      },
      {
        text: "Since they may not be able to see the video, there needs to be a voice track describing what is happening.",
        time: 7.3,
        timeEnd: 11.67,
      },
      {
        text: "For example, right now a boy is collecting flowers in the forest, happening across a crashed UFO and its beautiful inhabitant.",
        time: 16.4,
        timeEnd: 22.52,
      },
      {
        text: "The boy tries to hide behind a tree but his curiosity overpowers him. It isn't long before she notices him.",
        time: 28.2,
        timeEnd: 33.51,
      },
      {
        text: "She stands before him. He holds out a trembling hand to shake. She has no concept of this.",
        time: 38.2,
        timeEnd: 43.42,
      },
      {
        text: "With a sneeze, she transforms from one beautiful form to another. She transforms, from the K-Pop idol Minnie, to the K-Pop idol Mi-yeon. They are both members of (G)I-DLE.",
        time: 44,
        timeEnd: 54.36,
      },
      {
        text: "Starting to get the idea? Why don't you give it a go?",
        time: 62.1,
        timeEnd: 65.03,
      },
    ],
    duckingTimes: [
      {
        time: 0.6,
        timeEnd: 3.39,
      },
      {
        time: 7.3,
        timeEnd: 11.67,
      },
      {
        time: 16.4,
        timeEnd: 22.52,
      },
      {
        time: 28.2,
        timeEnd: 33.51,
      },
      {
        time: 38.2,
        timeEnd: 43.42,
      },
      {
        time: 44,
        timeEnd: 54.36,
      },
      {
        time: 62.1,
        timeEnd: 65.03,
      },
    ],
  }
}
