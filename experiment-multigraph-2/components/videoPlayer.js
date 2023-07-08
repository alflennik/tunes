define({ videoPlayer })({
  watch: {
    tunesPlayer: { video: { youtubeId } },
  },
  receive: { timeInterval },
  share: { time, play, pause, playMode },
  track: { youtubePlayer, intervalId },

  update: ({ _ }) => {
    if (!last) {
      set(content).once(() => `<div id="player"></div>`)

      return stop(async () => {
        const youtubePlayer = await new Promise(async resolve => {
          window.onYouTubeIframeAPIReady = function () {
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
        })

        youtubePlayer.addEventListener("onReady", () => {
          youtubePlayer.setVolume(50)
        })

        return youtubePlayer
      })
    }

    section("play mode").once(() => {
      youtubePlayer.addEventListener("onStateChange", () => {
        if (eventData === YT.PlayerState.PLAYING) {
          _.set(_.playMode)("playing")
        } else if (eventData === YT.PlayerState.PAUSED) {
          _.set(_.playMode)("paused")
        } else if (eventData === YT.PlayerState.BUFFERING) {
          _.set(_.playMode)("buffering")
        } else if (eventData === YT.PlayerState.ENDED) {
          _.set(_.playMode)("ended")
        }
      })
    })

    section("time").by(() => {
      if ($playMode === "playing" && !$intervalId) {
        set(intervalId)(
          setInterval(() => {
            _.set(_.time)(_.youtubePlayer.getCurrentTime())
            console.info(Math.round(_.$time * 1000) / 1000)
          }, $timeInterval)
        )
      } else if ($intervalId) {
        clearInterval($intervalId)
      }
    })

    if (justChanged(youtubeId)) youtubePlayer.loadVideoById({ videoId: youtubeId })

    set(play).once(() => () => youtubePlayer.playVideo())

    set(pause).once(() => () => youtubePlayer.pauseVideo())
  },
})
