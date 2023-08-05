import { define, justChanged, reconcile, equivalent, element } from "../utilities/multigraph.js"

define("audioDescription", {
  watch: {
    tunesPlayer: { video: { descriptionPath } },
    videoPlayer: { playMode, time },
    voice: { say, pause, play, clear, playMode },
  },
  share: { playMode, content },
  track: { descriptions, description, analysis, spokenItem },

  update: function ({ stop }) {
    if (justChanged($video)) {
      return stop(async () => {
        const descriptionModule = await import(this.video.descriptionPath)
        const { descriptions, analysis } = descriptionModule.default
        this.descriptions = descriptions
        this.analysis = analysis
      })
    }

    description = descriptions.reverse().find(each => time > each.time)

    playMode = (() => {
      if (justChanged($videoPlayer.$playMode)) {
        switch (videoPlayer.playMode) {
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
      if (justChanged($voice.$playMode, "ended") && equivalent($spokenItem, $analysis)) {
        return "ended"
      }
    })()

    spokenItem = justChanged($videoPlayer.$time, null) && analysis ? analysis : description

    /* Voice */
    {
      const isTimeSeek = $time.last && Math.abs(time - $time.last) > 1

      if (equivalent($spokenItem, $analysis)) {
        if (!isTimeSeek) {
          voice.play()
          voice.say(spokenItem)
        } else {
          voice.clear()
        }
      }
      if (justChanged($videoPlayer.$playMode, "paused")) {
        voice.pause()
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
