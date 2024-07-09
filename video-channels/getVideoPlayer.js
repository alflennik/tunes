const getVideoPlayer = async ({
  node,
  startsMuted = false,
  getVideo,
  getStartSeconds = () => undefined,
  onEnd = null,
  getAudioElement,
  getCaptions,
  getDuckingTimes,
  listenForChange = null,
}) => {
  node.innerHTML = /* HTML */ `<style>
      .caption-container {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
      .youtube-player-wrap {
        font-size: 16px;
      }
      .active-caption {
        line-height: 1.25em;
        height: 4.4em;
        padding: 0.5em 3em 0.25em;
        overflow: hidden;
        text-align: center;
        font-size: 16px;
        box-sizing: border-box;
      }
      #youtube-player {
        display: block;
      }
    </style>
    <div class="caption-container">
      <div class="youtube-player-wrap">
        <div id="youtube-player"></div>
      </div>
      <div class="active-caption" active-caption></div>
    </div>`

  const activeCaption = node.querySelector("[active-caption]")

  const refreshVideoDimensions = () => {
    const youtubeContainer = node.querySelector("#youtube-player")

    const { width: availableWidth, height: availableHeightBeforeCaptions } =
      node.getBoundingClientRect()

    const captionsHeight = activeCaption.getBoundingClientRect().height

    const availableHeight = availableHeightBeforeCaptions - captionsHeight

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

    youtubeContainer.style.width = `${width}px`
    youtubeContainer.style.height = `${height}px`
  }

  window.addEventListener("resize", () => {
    refreshVideoDimensions()
  })

  refreshVideoDimensions()

  let audioElement
  let duckingTimes
  let captions

  const handleChange = () => {
    refreshVideoDimensions()

    audioElement = getAudioElement()
    if (audioElement) {
      // Note that this will not work on iOS. But since iOS also does not support audio ducking,
      // the volume will actually need to be 1 (maximum) to overpower the music.
      audioElement.volume = 0.25
    }
    duckingTimes = getDuckingTimes()

    captions = getCaptions()
    const hasCaptions = captions && captions.length

    if (hasCaptions && activeCaption.style.display === "none") {
      activeCaption.style.display = "block"
    } else if (!hasCaptions && activeCaption.style.display !== "none") {
      activeCaption.style.display = "none"
    }
  }

  listenForChange(handleChange)

  handleChange()

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

    if (currentTime && duckingTimes) {
      const isDucking = duckingTimes.some(
        ({ time, timeEnd }) => currentTime >= time && currentTime <= timeEnd
      )

      if (isDucking) {
        setVolumeGradually(0.5)
      } else {
        setVolumeGradually(1)
      }
    }

    if (currentTime && captions) {
      const caption = captions.find(
        ({ time, timeEnd }) => currentTime >= time && currentTime <= timeEnd
      )

      if (activeCaption.innerText !== (caption ? caption.text : "")) {
        if (caption) {
          activeCaption.innerText = caption.text
        } else {
          activeCaption.innerText = ""
        }
      }
    }
  }, 100)

  getCurrentTimeRef.current = getCurrentTime

  return { seekTo }
}
