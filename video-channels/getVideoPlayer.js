const getVideoPlayer = async ({
  node,
  startsMuted = false,
  getVideo,
  getStartSeconds = () => undefined,
  onEnd = null,
  getAudioElement,
  listenForChange = null,
}) => {
  node.innerHTML = /* HTML */ `<style>
      #youtube-player {
        width: 100%;
      }
    </style>
    <div id="youtube-player"></div> `

  let audioElement = getAudioElement()

  listenForChange(() => {
    if (audioElement !== getAudioElement()) {
      if (audioElement) audioElement.pause()
      audioElement = getAudioElement()
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
    console.log("seeking", getCurrentTimeRef.current(), audioElement.duration)
    if (getCurrentTimeRef.current && audioElement) {
      if (getCurrentTimeRef.current() <= audioElement.duration) {
        audioElement.currentTime = audioElement.duration
      } else {
        audioElement.currentTime = getCurrentTimeRef.current()
        console.log(audioElement.currentTime)
      }
    }
  }

  const { seekTo, getCurrentTime } = await getYouTubePlayer({
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

  getCurrentTimeRef.current = getCurrentTime

  return { seekTo }
}
