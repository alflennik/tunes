import define from "../utilities/define.js"
import { component, fragment } from "../utilities/fun-html.js"
import AudioDescription from "./audio-description.js"
import YouTubePlayer from "./youtube-player.js"

export default class TunesPlayer extends HTMLElement {
  constructor() {
    super()
  }

  initializeState = {
    time: null,
    lastSong: null,
    isYouTubeReady: false,
    isPlaying: false,
    isDescriptionReady: false,
    videoId: "nE1ZXUE_BXU",
  }

  initializeActions = ({ stateSetters }) => ({
    playYouTube: () => {},
    onYouTubeReady: () => {
      // this.youTubePlayer.play();
    },
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
  })

  reactiveTemplate() {
    const {
      onUpdateTime,
      onDescriptionsReady,
      onYouTubeReady,
      onYouTubePause,
      onYouTubePlay,
      handleSongChange,
    } = this.actions
    const { song } = this.bindings
    const { lastSong } = this.state

    if (song.id !== lastSong?.id) handleSongChange(song)

    const { time, isPlaying } = this.state

    return fragment(
      component(YouTubePlayer).reference(this, "youTubePlayer").bindings({
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
        onReady: onDescriptionsReady,
      })
    )
  }
}

define({ TunesPlayer })
