import { define, justChanged, reconcile, once, doOnce, element } from "../utilities/multigraph.js"

define("videoPlayer", {
  watch: {
    tunesPlayer: { video: { youtubeId } },
  },
  receive: { timeInterval },
  share: { time, play, pause, playMode, volume, setVolume, ui },
  track: { youtubePlayer, intervalId, transitionVolume, transitionVolumeIntervalId },

  update: function ({ stop, ripple, change }) {
    if ($this.isInitialRender) {
      return stop(async () => {
        await ripple(() => {
          this.ui = reconcile(this.$ui, element("div").attributes({ id: "player" }))
        })

        const youtubePlayer = await new Promise(async resolve => {
          window.onYouTubeIframeAPIReady = () => {
            const youtubePlayer = new YT.Player("player", {
              height: "315",
              width: "560",
              videoId: this.youtubeId,
              playerVars: {
                playsinline: 1, // Instead of immediately going full screen.
                color: "white", // Instead of youtube red.
                rel: 0, // Prefer videos from the same channel after it ends.
              },
            })

            youtubePlayer.addEventListener("onReady", () => {
              resolve(youtubePlayer)
            })
          }

          var scriptElement = document.createElement("script")
          scriptElement.src = "https://www.youtube.com/iframe_api"
          var firstScriptTag = document.getElementsByTagName("script")[0]
          firstScriptTag.parentNode.insertBefore(scriptElement, firstScriptTag)
        })

        change(() => {
          this.youtubePlayer = youtubePlayer
          this.transitionVolume = 1
          this.volume = 1
          this.youtubePlayer.setVolume(this.volume * 100)
        })
      })
    }

    doOnce($playMode, () => {
      playMode = "unstarted"
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
    {
      if (justChanged($youtubeId)) time = null
      if (playMode === "playing" && !intervalId) {
        intervalId = setInterval(() => {
          change(() => {
            this.time = this.youtubePlayer.getCurrentTime()
          })
          console.info(Math.round(this.time * 1000) / 1000)
        }, timeInterval)
      } else if (playMode !== "playing" && intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }

    if (justChanged($youtubeId)) {
      youtubePlayer.loadVideoById({ videoId: youtubeId })
    }

    play = once($play, () => {
      this.youtubePlayer.playVideo()
    })

    pause = once($pause, () => {
      this.youtubePlayer.pauseVideo()
    })

    setVolume = once($setVolume, number => {
      if (this.transitionVolumeIntervalId) clearInterval(this.transitionVolumeIntervalId)

      this.transitionVolumeIntervalId = setInterval(() => {
        if (this.transitionVolume < this.volume) {
          this.transitionVolume += 0.025
          this.youtubePlayer.setVolume(this.transitionVolume * 100)
          if (this.transitionVolume > this.volume) clearInterval(this.transitionVolumeIntervalId)
        }
        if (this.transitionVolume > this.volume) {
          this.transitionVolume -= 0.025
          this.youtubePlayer.setVolume(this.transitionVolume * 100)
          if (this.transitionVolume < this.volume) clearInterval(this.transitionVolumeIntervalId)
        }
      }, 25)

      this.volume = number
    })

    doOnce($this, () => {
      document.addEventListener("keydown", event => {
        if (event.key === "k") {
          if (this.playMode === "playing") this.pause()
          if (this.playMode === "paused") this.play()
        }
      })
    })
  },
})
