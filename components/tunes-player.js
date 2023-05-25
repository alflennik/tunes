import define from "../utilities/define.js"
import { component, element, fragment } from "../utilities/reconciler.js"
import AudioDescription from "./audio-description.js"
import VoiceSynthesized from "./voice-synthesized.js"
import YouTubePlayer from "./youtube-player.js"

export default class TunesPlayer extends HTMLElement {
  constructor() {
    super()
  }

  initializeState = {
    time: null,
    currentVideo: null,
    currentPlaylist: null,
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
    handleContentChange: () => {
      const { content } = this.bindings
      const { setCurrentVideo, setCurrentPlaylist, setTime } = stateSetters
      setCurrentVideo(content.video)
      setCurrentPlaylist(content.playlist)
      setTime(null)
    },
    handleFirstClick: async ({ isKeyDown, isClickInterceptor }) => {
      const { youTubePlayer, voiceSynthesized } = this
      const { setHasCompletedInitialClick } = stateSetters

      await voiceSynthesized.onFirstInteraction()

      const clickInterceptor = document.querySelector(".click-interceptor")
      clickInterceptor.style.display = "none"
      setHasCompletedInitialClick(true)

      if (!isKeyDown && isClickInterceptor) youTubePlayer.play()
    },
    onDescriptionEnd: () => {
      const { currentPlaylist, currentVideo } = this.state
      const { setCurrentVideo } = stateSetters

      if (currentPlaylist) {
        const currentIndex = currentPlaylist.videos.findIndex(
          (video) => video.id === currentVideo.id
        )

        const nextVideo = currentPlaylist.videos[currentIndex + 1]

        if (nextVideo) {
          setCurrentVideo(nextVideo)
        }
      }
    },
  })

  connectedCallback() {
    const { handleFirstClick, handleContentChange } = this.actions

    const listenForFirstClick = async (event) => {
      const isKeyDown = event.type === "keydown"

      const clickInterceptor = document.querySelector(".click-interceptor")
      const isClickInterceptor =
        event.target === clickInterceptor || clickInterceptor.contains(event.target)

      await handleFirstClick({ isKeyDown, isClickInterceptor })

      document.removeEventListener("click", listenForFirstClick)
      document.removeEventListener("keydown", listenForFirstClick)
    }

    document.addEventListener("click", listenForFirstClick)
    document.addEventListener("keydown", listenForFirstClick)

    handleContentChange()
  }

  reactiveTemplate() {
    const {
      onUpdateTime,
      onDescriptionsReady,
      onYouTubeReady,
      onYouTubePause,
      onYouTubePlay,
      onYouTubeEnd,
      onDescriptionEnd,
      handleContentChange,
    } = this.actions
    const { content } = this.bindings
    const { currentVideo, currentPlaylist, hasCompletedInitialClick } = this.state

    if (!this.voiceSynthesized) {
      this.voiceSynthesized = new VoiceSynthesized()
    }

    if (content.video.id !== currentVideo?.id || content.playlist?.id !== currentPlaylist?.id) {
      handleContentChange()
    }

    const { time, isPlaying, isEnded } = this.state

    return fragment(
      element("div")
        .reference(this, "clickInterceptor")
        .attributes({ class: "click-interceptor", "tab-index": 0 })
        .children(element("button").children(`Play ${currentVideo.title}`)),
      component(YouTubePlayer)
        .attributes({ "aria-hidden": hasCompletedInitialClick ? undefined : true })
        .reference(this, "youTubePlayer")
        .bindings({
          videoId: currentVideo.youTubeId,
          onUpdateTime,
          onReady: onYouTubeReady,
          onPlay: onYouTubePlay,
          onPause: onYouTubePause,
          onEnd: onYouTubeEnd,
        }),
      component(AudioDescription).bindings({
        song: currentVideo,
        time,
        isPlaying,
        isEnded,
        voice: this.voiceSynthesized,
        onReady: onDescriptionsReady,
        onEnd: onDescriptionEnd,
      })
    )
  }
}

define({ TunesPlayer })
