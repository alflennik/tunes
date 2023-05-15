import define from "../utilities/define.js"
import { component, element, fragment } from "../utilities/fun-html.js"
import AudioDescription from "./audio-description.js"
import VoicePrerecorded from "./voice-prerecorded.js"
import VoiceSynthesized from "./voice-synthesized.js"
import YouTubePlayer from "./youtube-player.js"

export default class TunesPlayer extends HTMLElement {
  constructor() {
    super()
  }

  initializeState = {
    time: null,
    lastSong: null,
    isPlaying: false,
    isEnded: false,
    hasCompletedInitialClick: false,
  }

  initializeActions = ({ stateSetters }) => ({
    onYouTubeReady: () => {},
    onYouTubePause: () => {
      const { setIsPlaying, setIsEnded } = stateSetters
      setIsPlaying(false)
      setIsEnded(false)
    },
    onYouTubePlay: () => {
      const { setIsPlaying, setIsEnded } = stateSetters
      setIsPlaying(true)
      setIsEnded(false)
    },
    onYouTubeEnd: () => {
      const { setIsPlaying, setIsEnded } = stateSetters
      setIsPlaying(false)
      setIsEnded(true)
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
      const { youTubePlayer, clickInterceptor, voicePrerecorded, voiceSynthesized } = this
      const { setHasCompletedInitialClick } = stateSetters

      const isKeyDown = event.type === "keydown"

      clickInterceptor.style.display = "none"
      setHasCompletedInitialClick(true)

      await Promise.all([
        voiceSynthesized.onFirstInteraction(),
        voicePrerecorded.onFirstInteraction(),
      ])

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
      onYouTubeEnd,
      handleSongChange,
      handleFirstClick,
    } = this.actions
    const { song } = this.bindings
    const { lastSong, hasCompletedInitialClick } = this.state

    if (!this.voiceSynthesized) {
      this.voicePrerecorded = new VoicePrerecorded()
      this.voiceSynthesized = new VoiceSynthesized()
    }

    if (song.id !== lastSong?.id) handleSongChange(song)

    const { time, isPlaying, isEnded } = this.state

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
          onEnd: onYouTubeEnd,
        }),
      component(AudioDescription).bindings({
        song,
        time,
        isPlaying,
        isEnded,
        voice: song.hasPrerecordedVoice ? this.voicePrerecorded : this.voiceSynthesized,
        onReady: onDescriptionsReady,
      })
    )
  }
}

define({ TunesPlayer })
