const getVideoPlayer = async ({
  node,
  startsMuted = false,
  getVideo,
  getStartSeconds = () => undefined,
  onEnd = null,
  getAudioElement,
  // getAudioCaptions,
  getDuckingTimes,
  listenForChange = null,
}) => {
  node.innerHTML = /* HTML */ `<style>
      .youtube-player-wrap {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      #youtube-player {
      }
    </style>
    <div class="youtube-player-wrap">
      <div id="youtube-player"></div>
    </div>`

  const refreshVideoDimensions = () => {
    const youtubeContainer = node.querySelector("#youtube-player")

    const { width: availableWidth, height: availableHeight } = node.getBoundingClientRect()
    console.log("availableWidth", availableWidth, "availableHeight", availableHeight)
    const availableRatio = availableWidth / availableHeight

    const { aspectRatio } = getVideo()

    let width
    let height

    const widthIsDominant = aspectRatio > availableRatio
    if (widthIsDominant) {
      width = availableWidth
      height = availableWidth / aspectRatio
    } else {
      height = availableHeight
      width = availableHeight * aspectRatio
    }

    console.log("width", width, "height", height)

    youtubeContainer.style.width = `${width}px`
    youtubeContainer.style.height = `${height}px`
  }

  window.addEventListener("resize", () => {
    refreshVideoDimensions()
  })

  refreshVideoDimensions()

  let audioElement = getAudioElement()
  let duckingTimes = getDuckingTimes()
  // let audioCaptions = getAudioCaptions()

  listenForChange(() => {
    refreshVideoDimensions()

    if (audioElement !== getAudioElement()) {
      if (audioElement) audioElement.pause() // Old audio element should not play
      audioElement = getAudioElement()
      duckingTimes = getDuckingTimes()
      // audioCaptions = getAudioCaptions()

      // Note that this will not work on iOS. But since iOS also does not support audio ducking,
      // the volume will actually need to be 1 (maximum) to overpower the music.
      audioElement.volume = 0.25
    }
  })

  const onPlay = () => {
    if (audioElement && getCurrentTimeRef.current() < audioElement.duration) {
      audioElement.play()
    }
  }

  const onPause = () => {
    if (audioElement) {
      audioElement.pause()
    }
  }

  let getCurrentTimeRef = { current: null }

  const onSeek = () => {
    if (getCurrentTimeRef.current && audioElement) {
      if (getCurrentTimeRef.current() >= audioElement.duration) {
        audioElement.currentTime = audioElement.duration
      } else {
        audioElement.currentTime = getCurrentTimeRef.current()
      }
    }
  }

  const { seekTo, getCurrentTime, setVolume } = await getYouTubePlayer({
    youtubePlayerId: "youtube-player",
    startsMuted,
    getVideoId: () => getVideo().id,
    getStartSeconds,
    listenForChange,
    onEnd,
    onPlay,
    onPause,
    onSeek,
  })

  const setVolumeGradually = setVolume // TODO

  setInterval(() => {
    const currentTime = getCurrentTime()

    if (!(currentTime && duckingTimes)) return

    const isDucking = duckingTimes.some(
      ({ time, timeEnd }) => currentTime >= time && currentTime <= timeEnd
    )

    if (isDucking) {
      setVolumeGradually(0.5)
    } else {
      setVolumeGradually(1)
    }
  }, 100)

  getCurrentTimeRef.current = getCurrentTime

  return { seekTo }
}
