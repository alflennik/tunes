import define from "../utilities/define.js"
import { component, element, fragment } from "../utilities/fun-html.js"
import AudioDescription from "./audio-description.js"
import Voice from "./voice.js"
import YouTubePlayer from "./youtube-player.js"

export default class TunesPlayer extends HTMLElement {
  constructor() {
    super()
  }

  initializeState = {
    time: null,
    lastSong: null,
    isPlaying: false,
    hasCompletedInitialClick: false,
  }

  initializeActions = ({ stateSetters }) => ({
    onYouTubeReady: () => {},
    onYouTubePause: () => {
      const { setIsPlaying } = stateSetters
      setIsPlaying(false)
    },
    onYouTubePlay: () => {
      const { setIsPlaying } = stateSetters
      setIsPlaying(true)
    },
    onDescriptionsReady: () => {},
    onUpdateTime: (time) => {
      const { setTime } = stateSetters
      setTime(time)
    },
    handleSongChange: (song) => {
      const { setLastSong, setTime } = stateSetters
      setLastSong(song)
      setTime(null)
    },
    handleFirstClick: async (event) => {
      const { youTubePlayer, clickInterceptor, voice } = this
      const { setHasCompletedInitialClick } = stateSetters

      const isKeyDown = event.type === "keydown"

      clickInterceptor.style.display = "none"
      setHasCompletedInitialClick(true)

      await voice.onFirstInteraction()

      if (!isKeyDown) youTubePlayer.play()
    },
  })

  reactiveTemplate() {
    const {
      onUpdateTime,
      onDescriptionsReady,
      onYouTubeReady,
      onYouTubePause,
      onYouTubePlay,
      handleSongChange,
      handleFirstClick,
    } = this.actions
    const { song } = this.bindings
    const { lastSong, hasCompletedInitialClick } = this.state

    if (!this.voice) {
      this.voice = new Voice()
    }

    if (song.id !== lastSong?.id) handleSongChange(song)

    const { time, isPlaying } = this.state

    return fragment(
      element("div")
        .reference(this, "clickInterceptor")
        .attributes({ class: "click-interceptor", "tab-index": 0 })
        .listeners({ click: handleFirstClick, keydown: handleFirstClick })
        .children(
          element("button").listeners({ click: handleFirstClick }).children(`Play ${song.title}`)
        ),
      component(YouTubePlayer)
        .attributes({ "aria-hidden": hasCompletedInitialClick ? undefined : true })
        .reference(this, "youTubePlayer")
        .bindings({
          videoId: song.youTubeId,
          onUpdateTime,
          onReady: onYouTubeReady,
          onPlay: onYouTubePlay,
          onPause: onYouTubePause,
        }),
      component(AudioDescription).bindings({
        song,
        time,
        isPlaying,
        voice: this.voice,
        onReady: onDescriptionsReady,
      })
    )
  }
}

define({ TunesPlayer })
