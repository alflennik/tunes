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
    isReady: false,
    time: null,
    currentVideo: null,
    currentPlaylist: null,
    lastBoundVideo: null,
    lastBoundPlaylist: null,
    isPlaying: false,
    isEnded: false,
    hasCompletedInitialClick: false
  }

  initializeActions = ({ stateSetters }) => ({
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
    onYouTubeReady: () => {
      const { setIsReady } = stateSetters

      if (this.audioDescription.state.isReady) {
        setIsReady(true)
      }
    },
    onDescriptionsReady: () => {
      const { setIsReady } = stateSetters

      if (this.youtubePlayer.state.isReady) {
        setIsReady(true)
      }
    },
    onUpdateTime: time => {
      const { setTime } = stateSetters

      setTime(time)
    },
    handleContentChange: () => {
      const { content } = this.bindings
      const {
        setLastBoundVideo,
        setLastBoundPlaylist,
        setCurrentVideo,
        setCurrentPlaylist,
        setTime
      } = stateSetters
      setLastBoundVideo(content.video)
      setLastBoundPlaylist(content.playlist)
      setCurrentVideo(content.video)
      setCurrentPlaylist(content.playlist)
      setTime(null)
    },
    handleFirstClick: async ({ isKeyDown, isClickInterceptor }) => {
      const { youtubePlayer, voiceSynthesized } = this
      const { setHasCompletedInitialClick } = stateSetters

      await voiceSynthesized.onFirstInteraction()

      const clickInterceptor = document.querySelector(".click-interceptor")
      clickInterceptor.style.display = "none"
      setHasCompletedInitialClick(true)

      if (!isKeyDown && isClickInterceptor) youtubePlayer.play()
    },
    onDescriptionsLoading: () => {
      const { setIsReady } = stateSetters
      setIsReady(false)
    },
    onDescriptionEnd: () => {
      const { currentPlaylist, currentVideo } = this.state
      const { setCurrentVideo } = stateSetters

      if (currentPlaylist) {
        const currentIndex = currentPlaylist.videos.findIndex(video => video.id === currentVideo.id)

        const nextVideo = currentPlaylist.videos[currentIndex + 1]

        if (nextVideo) {
          setCurrentVideo(nextVideo)
        }
      }
    },
    play: () => {
      this.youtubePlayer.play()
    }
  })

  connectedCallback() {
    const { handleFirstClick, handleContentChange } = this.actions

    const listenForFirstClick = async event => {
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
      onDescriptionsLoading,
      onDescriptionsReady,
      onYouTubeReady,
      onYouTubePause,
      onYouTubePlay,
      onYouTubeEnd,
      onDescriptionEnd,
      handleContentChange
    } = this.actions
    const { content } = this.bindings
    const { currentVideo, lastBoundVideo, lastBoundPlaylist, hasCompletedInitialClick } = this.state

    if (!this.voiceSynthesized) {
      this.voiceSynthesized = new VoiceSynthesized()
    }

    if (content.video.id !== lastBoundVideo?.id || content.playlist?.id !== lastBoundPlaylist?.id) {
      handleContentChange()
    }

    const { time, isPlaying, isEnded } = this.state

    return fragment(
      element("div")
        .reference(this, "clickInterceptor")
        .attributes({ class: "click-interceptor", "tab-index": 0 })
        .items(element("button").text(`Play ${currentVideo.title}`)),
      component(YouTubePlayer)
        .reference(this, "youtubePlayer")
        .attributes({ "aria-hidden": hasCompletedInitialClick ? undefined : true })
        .bindings({
          videoId: currentVideo.youtubeId,
          onUpdateTime,
          onReady: onYouTubeReady,
          onPlay: onYouTubePlay,
          onPause: onYouTubePause,
          onEnd: onYouTubeEnd
        }),
      component(AudioDescription).reference(this, "audioDescription").bindings({
        video: currentVideo,
        time,
        isPlaying,
        isEnded,
        voice: this.voiceSynthesized,
        onLoading: onDescriptionsLoading,
        onReady: onDescriptionsReady,
        onEnd: onDescriptionEnd
      })
    )
  }
}

define({ "tunes-player": TunesPlayer })
