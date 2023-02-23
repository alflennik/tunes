import define from "../utilities/define.js"

export default class YouTubePlayer extends HTMLElement {
  #player

  constructor() {
    super()
  }

  initializeState = {
    intervalId: null,
  }

  initializeActions = ({ stateSetters }) => ({
    onYouTubeChange: (eventData) => {
      const { onUpdateTime } = this.bindings
      const { intervalId } = this.state
      const { setIntervalId } = stateSetters

      if (eventData === YT.PlayerState.PLAYING && !intervalId) {
        const intervalId = setInterval(() => {
          const seconds = this.#player.getCurrentTime()
          onUpdateTime(seconds)
          console.log(Math.round(seconds * 1000) / 1000)
        }, /* 20 */ 800)

        setIntervalId(intervalId)
      } else if (intervalId) {
        clearInterval(intervalId)
        setIntervalId(null)
      }
    },
  })

  async connectedCallback() {
    const { videoId, onReady } = this.bindings
    const { onYouTubeChange } = this.actions

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

    this.#player.addEventListener("onReady", () => {
      onReady()
    })

    this.#player.addEventListener("onStateChange", (event) => {
      onYouTubeChange(event.data)
    })
  }

  play() {
    this.#player.playVideo()
  }
}

define({ "youtube-player": YouTubePlayer })
