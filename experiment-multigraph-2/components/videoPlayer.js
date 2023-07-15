videoPlayer = defineModule({
  watch: {
    tunesPlayer: { video: { youtubeId } },
  },
  receive: { timeInterval },
  share: { time, play, pause, playMode },
  track: { youtubePlayer, intervalId },

  update: ({ beat }) => {
    if (!last) {
      content = once($content, () => `<div id="player"></div>`)

      return stop(async () => {
        const youtubePlayer = await new Promise(async resolve => {
          window.onYouTubeIframeAPIReady = function () {
            beat()
            resolve(
              new YT.Player("player", {
                height: "315",
                width: "560",
                videoId: youtubeId,
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
        }).then(beat)

        youtubePlayer.addEventListener("onReady", () => {
          beat()
          youtubePlayer.setVolume(50)
        })

        return youtubePlayer
      })
    }

    once("play mode", () => {
      youtubePlayer.addEventListener("onStateChange", eventData => {
        beat()
        if (eventData === YT.PlayerState.PLAYING) {
          playMode = "playing"
        } else if (eventData === YT.PlayerState.PAUSED) {
          playMode = "paused"
        } else if (eventData === YT.PlayerState.BUFFERING) {
          playMode = "buffering"
        } else if (eventData === YT.PlayerState.ENDED) {
          playMode = "ended"
        }
      })
    })

    /* Time */
    {
      if (playMode === "playing" && !intervalId) {
        intervalId = setInterval(() => {
          beat()
          time = youtubePlayer.getCurrentTime()
          console.info(Math.round($time * 1000) / 1000)
        }, timeInterval)
      } else if (intervalId) {
        clearInterval(intervalId)
      }
    }

    if (justChanged($youtubeId)) youtubePlayer.loadVideoById({ videoId: youtubeId })

    play = onceFn($play, () => {
      youtubePlayer.playVideo()
    })

    pause = onceFn($pause, () => {
      youtubePlayer.pauseVideo()
    })
  },
})
