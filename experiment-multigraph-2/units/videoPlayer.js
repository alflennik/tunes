import { define, justChanged, reconcile, once, doOnce, element } from "../utilities/multigraph.js"

define("videoPlayer", {
  watch: {
    tunesPlayer: { video: { youtubeId } },
  },
  receive: { timeInterval },
  share: { time, play, pause, playMode, content },
  track: { youtubePlayer, intervalId },

  update: function ({ stop, ripple, change }) {
    if ($this.isInitialRender) {
      return stop(async () => {
        await ripple(() => {
          this.content = reconcile(this.$content, element("div").attributes({ id: "player" }))
        })

        const youtubePlayer = await new Promise(async resolve => {
          window.onYouTubeIframeAPIReady = () => {
            resolve(
              new YT.Player("player", {
                height: "315",
                width: "560",
                videoId: this.youtubeId,
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

        youtubePlayer.addEventListener("onReady", () => {
          change(() => {
            this.youtubePlayer.setVolume(50)
          })
        })

        change(() => {
          this.youtubePlayer = youtubePlayer
        })
      })
    }

    doOnce($playMode, () => {
      youtubePlayer.addEventListener("onStateChange", ({ data }) => {
        change(() => {
          if (data === YT.PlayerState.UNSTARTED) {
            this.playMode = "unstarted"
          } else if (data === YT.PlayerState.PLAYING) {
            this.playMode = "playing"
          } else if (data === YT.PlayerState.PAUSED) {
            this.playMode = "paused"
          } else if (data === YT.PlayerState.BUFFERING) {
            this.playMode = "buffering"
          } else if (data === YT.PlayerState.ENDED) {
            this.playMode = "ended"
          } else {
            throw new Error("Unexpected case")
          }
        })
      })
    })

    /* Time */
    if (playMode === "playing" && !intervalId) {
      intervalId = setInterval(() => {
        change(() => {
          this.time = this.youtubePlayer.getCurrentTime()
        })
        console.info(Math.round(this.time * 1000) / 1000)
      }, timeInterval)
    } else if (playMode !== "playing" && intervalId) {
      clearInterval(intervalId)
    }

    if (justChanged($youtubeId)) youtubePlayer.loadVideoById({ videoId: youtubeId })

    play = once($play, () => {
      this.youtubePlayer.playVideo()
    })

    pause = once($pause, () => {
      this.youtubePlayer.pauseVideo()
    })
  },
})
