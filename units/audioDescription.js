import { define, justChanged, reconcile, equivalent, element } from "../utilities/multigraph.js"

define("audioDescription", {
  watch: {
    tunesPlayer: { video: { descriptionPath } },
    videoPlayer: { playMode, time, volume, setVolume },
    voice: { say, pause, play, clear, playMode },
  },
  share: { playMode, isPrerecorded, descriptions, analysis: { filePath }, content },
  track: { description, spokenItem },

  update: function ({ stop }) {
    if (justChanged($video)) {
      return stop(async () => {
        const descriptionModule = await import(this.video.descriptionPath)
        const { descriptions, analysis } = descriptionModule.default
        this.descriptions = descriptions
        this.analysis = analysis
        this.isPrerecorded = !!descriptions[0].filePath
      })
    }

    description = time && descriptions.findLast(each => time > each.time)

    playMode = (() => {
      if (justChanged($videoPlayer.$playMode)) {
        switch (videoPlayer.playMode) {
          case "unstarted":
            return "unstarted"
          case "playing":
            return "playing"
          case "paused":
          case "buffering":
            return "paused"
          case "ended":
            if (!analysis) return "ended"
            return "playing"
        }
      }
      if (
        justChanged($voice.$playMode, "ended") &&
        spokenItem &&
        equivalent($spokenItem, $analysis)
      ) {
        return "ended"
      }
      return playMode ?? "unstarted"
    })()

    spokenItem = (() => {
      if (justChanged($videoPlayer.$playMode, "ended") && analysis) return analysis
      if (description !== $description.currentValue) return description
      return spokenItem
    })()

    /* Voice */
    {
      const isTimeSeek = $time.lastValue && Math.abs(time - $time.lastValue) > 1
      const isVoiceReady = !!voice.playMode

      if (isVoiceReady && time && spokenItem && spokenItem !== $spokenItem.currentValue) {
        if (!isTimeSeek) {
          voice.play()
          voice.say(spokenItem)
        } else {
          voice.clear()
        }
      }
      if (isVoiceReady && justChanged($videoPlayer.$playMode)) {
        if (videoPlayer.playMode === "playing") {
          voice.play()
        } else if (videoPlayer.playMode === "paused") {
          voice.pause()
        } else if (videoPlayer.playMode === "unstarted") {
          voice.clear()
        }
      }
    }

    /* Video volume */
    if (voice.playMode) {
      switch (voice.playMode) {
        case "ended":
        case "paused":
          if (volume !== 1) setVolume(1)
          break
        case "unstarted":
        case "playing":
          if (volume !== 0.5) setVolume(0.5)
          break
        default:
          throw new Error("Unexpected case")
      }
    }

    content = reconcile(
      $content,
      element("audio-description").items(
        element("div")
          .attributes({ class: "wrapping-box" })
          .items(element("div").text(spokenItem?.text ?? ""))
      )
    )
  },
})
