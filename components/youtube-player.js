import define from "../utilities/define.js"

export default class YouTubePlayer extends HTMLElement {
  #player

  static get observedAttributes() {
    return ["bindings"]
  }

  constructor() {
    super()
  }

  initializeState = {
    intervalId: null,
    lastVideoId: undefined,
    isReady: false,
  }

  initializeActions = ({ stateSetters }) => ({
    handleConnect: () => {
      const { setIsReady } = stateSetters
      const { onReady } = this.bindings
      const { handleYouTubeChange } = this.actions

      this.#player.addEventListener("onReady", () => {
        const { trackLastVideoId } = this.actions
        const { videoId } = this.bindings

        this.#player.setVolume(50)
        trackLastVideoId(videoId)

        setIsReady(true)
        onReady()
      })

      this.#player.addEventListener("onStateChange", (event) => {
        handleYouTubeChange(event.data)
      })
    },

    handleYouTubeChange: (eventData) => {
      const { onUpdateTime, onPause, onPlay, onEnd } = this.bindings
      const { intervalId } = this.state
      const { setIntervalId } = stateSetters

      if (eventData === YT.PlayerState.PLAYING) {
        onPlay()
      } else if (eventData === YT.PlayerState.PAUSED) {
        onPause()
      } else if (eventData === YT.PlayerState.ENDED) {
        onEnd()
      }

      if (eventData === YT.PlayerState.PLAYING && !intervalId) {
        const intervalId = setInterval(() => {
          const seconds = this.#player.getCurrentTime()
          onUpdateTime(seconds)
          console.info(Math.round(seconds * 1000) / 1000)
        }, /* 20 */ 400)

        setIntervalId(intervalId)
      } else if (intervalId) {
        clearInterval(intervalId)
        setIntervalId(null)
      }
    },
    trackLastVideoId: (videoId) => {
      const { setLastVideoId } = stateSetters
      setLastVideoId(videoId)
    },
  })

  async connectedCallback() {
    const { handleConnect } = this.actions
    const { videoId } = this.bindings

    this.#player = await new Promise(async (resolve) => {
      this.innerHTML = `<div id="player"></div>`

      window.onYouTubeIframeAPIReady = function () {
        resolve(
          new YT.Player("player", {
            height: "315",
            width: "560",
            videoId,
            playerVars: {
              playsinline: 1,
            },
          })
        )
      }

      var scriptElement = document.createElement("script")
      scriptElement.src = "https://www.youtube.com/iframe_api"
      var firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode.insertBefore(scriptElement, firstScriptTag)
    })

    handleConnect()
  }

  bindingsChangedCallback() {
    const { lastVideoId } = this.state
    const { videoId } = this.bindings
    const { trackLastVideoId } = this.actions

    if (lastVideoId && videoId && lastVideoId !== videoId) {
      trackLastVideoId(videoId)
      this.#player.loadVideoById({ videoId })
    }
  }

  play() {
    this.#player.playVideo()
  }
}

define({ "youtube-player": YouTubePlayer })
