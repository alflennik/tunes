import getFFmpeg from "./ffmpeg/getFFmpeg.js"
import createEditorElement from "./createEditorElement.js"
import getAudio from "./getAudio.js"
import { getSignInPage, getSignedInPage } from "./getLoginPages.js"
import addStyle from "./utilities/addStyle.js"
import getId from "./utilities/getId.js"
import createElementHTML from "./utilities/createElementHTML.js"

const appClass = getId()

addStyle(`
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
  #root {
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
  .${appClass} {
    display: flex;
    align-items: stretch;
    height: 100%;
    width: 100%;

    .editor-container {
      height: 100%;
      width: 440px;
    }
    .video-player {
      height: 100%;
      width: calc(100% - 440px);
    }
  }
`)

const initializeApp = async () => {
  if (location.href.endsWith("/?/sign-in-with-github")) {
    getSignInPage()
    return
  } else if (location.href.endsWith("/?/signed-in-with-github")) {
    getSignedInPage()
    return
  }

  const root = document.querySelector("#root")

  const appElement = createElementHTML(`
    <div class="${appClass}">
      <div class="video-player"></div>
      <div class="editor-container"></div>
    </div>
  `)

  root.appendChild(appElement)

  const videoPlayerElement = appElement.querySelector(".video-player")
  const editorContainerElement = appElement.querySelector(".editor-container")

  const demoVideoId = "pCh3Kp6qxo8"
  let initialVideoId = location.href.match(/\?.*videoId=([^&]+)/)?.[1]
  if (!initialVideoId) initialVideoId = demoVideoId

  const videoDataMutableObservable = createObservable()
  const videoDataObservable = videoDataMutableObservable.getReadOnly()

  const savedContentMutableObservable = createObservable()
  const savedContentObservable = savedContentMutableObservable.getReadOnly()

  const loadVideoId = async videoId => {
    const [videoData, savedContent] = await Promise.all([
      fetch(`/api/video-data?videoId=${videoId}`).then(videoDataResponse =>
        videoDataResponse.json()
      ),
      (async () => {
        if (videoId === demoVideoId) return getDemoData()
        return getStarterData({ videoId: videoId })
        // return fetch(`/api/load?videoId=${videoId}`).then(savedResponse => savedResponse.json())
      })(),
    ])

    videoDataMutableObservable.update(videoData)
    savedContentMutableObservable.update(savedContent)
  }

  const userMutableObservable = createObservable()
  const userObservable = userMutableObservable.getReadOnly()

  const [{ ffmpeg, fetchFile, getMostRecentDurationSeconds }] = await Promise.all([
    getFFmpeg(),
    loadVideoId(initialVideoId),
    (async () => {
      const response = await fetch("/api/user")
      const user = await response.json()
      if (user) {
        userMutableObservable.update(user)
      }
    })(),
  ])

  const {
    renderAudio,
    audioElementObservable,
    audioCaptionsObservable,
    audioDuckingTimesObservable,
    audioStatusObservable,
  } = getAudio({
    ffmpeg,
    fetchFile,
    getMostRecentDurationSeconds,
    savedContentObservable,
  })

  const [{ seekTo }] = await Promise.all([
    getVideoPlayer({
      parentElement: videoPlayerElement,
      videoDataObservable,
      audioElementObservable,
      audioCaptionsObservable,
      audioDuckingTimesObservable,
    }),
  ])

  const { editorElement } = await createEditorElement({
    userMutableObservable,
    userObservable,
    seekTo,
    videoDataObservable,
    savedContentObservable,
    savedContentMutableObservable,
    renderAudio,
    audioStatusObservable,
    audioCaptionsObservable,
    audioDuckingTimesObservable,
    loadVideoId,
  })

  editorContainerElement.replaceChildren(editorElement)

  await renderAudio()
}

const getStarterData = ({ videoId }) => {
  return {
    videoId,
    descriptions: [
      {
        id: "id5644301",
        ssml: null,
        text: "",
        time: 0,
      },
    ],
  }
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

initializeApp()
