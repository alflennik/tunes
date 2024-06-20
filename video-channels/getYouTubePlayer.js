const getAvPermissions = () => {
  return new Promise(resolve => {
    const audioElement = new Audio("none.mp3")
    audioElement.addEventListener("ended", () => {
      resolve()
    })
    audioElement.play()
  })
}

const getYouTubePlayer = async ({
  youtubePlayerId,
  startsMuted = false,
  getStartSeconds = () => undefined,
  getVideoId,
  listenForChange = null,
  onEnd,
}) => {
  const youtubePlayer = await new Promise(async resolve => {
    window.onYouTubeIframeAPIReady = () => {
      const youtubePlayer = new YT.Player(youtubePlayerId, {
        height: "315",
        width: "560",
        videoId: getVideoId(),
        playerVars: {
          autoplay: 1,
          start: getStartSeconds(),
          playsinline: 1, // Instead of immediately going full screen.
          color: "white", // Instead of youtube red.
          rel: 0, // Recommend videos from the same channel after it ends.
        },
      })

      youtubePlayer.addEventListener("onReady", () => {
        resolve(youtubePlayer)
      })
    }

    const scriptElement = document.createElement("script")
    scriptElement.src = "https://www.youtube.com/iframe_api"
    const firstScriptTag = document.getElementsByTagName("script")[0]
    firstScriptTag.parentNode.insertBefore(scriptElement, firstScriptTag)
  })

  listenForChange(() => {
    youtubePlayer.loadVideoById({
      videoId: getVideoId(),
      startSeconds: getStartSeconds(),
    })
  })

  youtubePlayer.setVolume(100)

  if (startsMuted) {
    youtubePlayer.mute()
  } else {
    youtubePlayer.unMute()
  }

  document.addEventListener("keydown", event => {
    if (event.key === "m") {
      if (youtubePlayer.isMuted()) {
        youtubePlayer.unMute()
      } else {
        youtubePlayer.mute()
      }
    }

    if (event.key === "k") {
      if (youtubePlayer.getPlayerState() === YT.PlayerState.PLAYING) {
        youtubePlayer.pauseVideo()
      } else if (youtubePlayer.getPlayerState() === YT.PlayerState.PAUSED) {
        youtubePlayer.playVideo()
      }
    }
  })

  youtubePlayer.addEventListener("onStateChange", ({ data }) => {
    if (data === YT.PlayerState.ENDED) onEnd()
  })
}
