import define from "../utilities/define.js"
import { component, fragment } from "../utilities/fun-html.js"
import DescriptionBox from "./description-box.js"
import YouTubePlayer from "./youtube-player.js"

export default class DescriptionPlayer extends HTMLElement {
  constructor() {
    super()
  }

  initializeState = {
    time: undefined,
    isYouTubeReady: false,
    isDescriptionReady: false,
    videoId: "nE1ZXUE_BXU",
  }

  initializeActions = ({ stateSetters }) => ({
    playYouTube: () => {},
    onYouTubeReady: () => {
      // this.youTubePlayer.play();
    },
    onDescriptionsReady: () => {},
    onUpdateTime: (time) => {
      const { setTime } = stateSetters
      setTime(time)
    },
  })

  reactiveTemplate() {
    const { videoId, time } = this.state
    const { onUpdateTime, onDescriptionsReady, onYouTubeReady } = this.actions

    return fragment(
      component(YouTubePlayer)
        .getReference(this, "youTubePlayer")
        .setBindings({ videoId, onUpdateTime, onReady: onYouTubeReady }),
      component(DescriptionBox).setBindings({ videoId, time, onReady: onDescriptionsReady })
    )
  }
}

define({ DescriptionPlayer })
