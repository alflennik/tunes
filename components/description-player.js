import define from "../utilities/define.js"
import { component, fragment } from "../utilities/fun-html.js"
import AudioDescription from "./audio-description.js"
import YouTubePlayer from "./youtube-player.js"

export default class DescriptionPlayer extends HTMLElement {
  constructor() {
    super()
  }

  initializeState = {
    time: undefined,
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
  })

  reactiveTemplate() {
    const { time, isPlaying } = this.state
    const { onUpdateTime, onDescriptionsReady, onYouTubeReady, onYouTubePause, onYouTubePlay } =
      this.actions
    const { song } = this.bindings

    return fragment(
      component(YouTubePlayer).getReference(this, "youTubePlayer").setBindings({
        videoId: song.youTubeId,
        onUpdateTime,
        onReady: onYouTubeReady,
        onPlay: onYouTubePlay,
        onPause: onYouTubePause,
      }),
      component(AudioDescription).setBindings({
        song,
        time,
        isPlaying,
        onReady: onDescriptionsReady,
      })
    )
  }
}

define({ DescriptionPlayer })
