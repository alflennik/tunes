videoPlayer = defineModule({
  watch: {
    tunesPlayer: { video: { youtubeId } },
  },
  receive: { timeInterval },
  share: { time, play, pause, playMode },
  track: { youtubePlayer, intervalId },

  update: function ({ stop, change }) {
    if (!last) {
      return stop(async () => {
        this.content.innerHTML = `<div id="player"></div>`

        const youtubePlayer = await new Promise(async resolve => {
          window.onYouTubeIframeAPIReady = function () {
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

    doOnce("play mode", () => {
      youtubePlayer.addEventListener("onStateChange", eventData => {
        change(() => {
          if (eventData === YT.PlayerState.PLAYING) {
            this.playMode = "playing"
          } else if (eventData === YT.PlayerState.PAUSED) {
            this.playMode = "paused"
          } else if (eventData === YT.PlayerState.BUFFERING) {
            this.playMode = "buffering"
          } else if (eventData === YT.PlayerState.ENDED) {
            this.playMode = "ended"
          }
        })
      })
    })

    /* Time */
    {
      if (playMode === "playing" && !intervalId) {
        intervalId = setInterval(() => {
          change(() => {
            this.time = this.youtubePlayer.getCurrentTime()
          })
          console.info(Math.round(this.time * 1000) / 1000)
        }, timeInterval)
      } else if (intervalId) {
        clearInterval(intervalId)
      }
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
