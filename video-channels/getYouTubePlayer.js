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
  startsMuted,
  videoDataObservable,
  startSecondsObservable,
  seekSecondsObservable,
  onPlay,
  onPause,
  onSeek,
  onEnd,
}) => {
  const youtubePlayer = await new Promise(async resolve => {
    window.onYouTubeIframeAPIReady = () => {
      const youtubePlayer = new YT.Player(youtubePlayerId, {
        height: "315",
        width: "560",
        videoId: videoDataObservable.getValue().id,
        playerVars: {
          autoplay: 1,
          start: startSecondsObservable.getValue(),
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

  let previousVideoId = videoDataObservable.getValue().id
  let previousStartSeconds = startSecondsObservable.getValue()

  onObservableChanges([videoDataObservable, startSecondsObservable], () => {
    if (
      previousVideoId !== videoDataObservable.getValue().id ||
      previousStartSeconds !== startSecondsObservable.getValue()
    ) {
      youtubePlayer.loadVideoById({
        videoId: videoDataObservable.getValue().id,
        startSeconds: startSecondsObservable.getValue(),
      })

      previousVideoId = videoDataObservable.getValue().id
      previousStartSeconds = startSecondsObservable.getValue()
    }
  })

  seekSecondsObservable.onChange(() => {
    if (seekSecondsObservable.getValue() == null) return

    youtubePlayer.seekTo(seekSecondsObservable.getValue(), true)
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
    if (data === YT.PlayerState.PLAYING && onPlay) onPlay()
    if ((data === YT.PlayerState.PAUSED || data === YT.PlayerState.BUFFERING) && onPause) onPause()
    if (data === YT.PlayerState.ENDED && onEnd) onEnd()
  })

  // Detect seeking
  let previousTime = youtubePlayer.getCurrentTime()
  setInterval(() => {
    const currentTime = youtubePlayer.getCurrentTime()

    if (previousTime != null && currentTime != null && Math.abs(currentTime - previousTime) > 0.2) {
      onSeek()
    }

    previousTime = currentTime
  }, 100)

  const seekTo = seconds => {
    youtubePlayer.seekTo(seconds, true)
    youtubePlayer.playVideo()
  }

  const setVolume = number => {
    youtubePlayer.setVolume(number * 100)
  }

  return { seekTo, getCurrentTime: () => youtubePlayer.getCurrentTime(), setVolume }
}
