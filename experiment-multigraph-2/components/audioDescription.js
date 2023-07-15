audioDescription = defineModule({
  watch: {
    tunesPlayer: { video: { descriptionPath } },
    videoPlayer: { playMode, time },
    voice: { say, pause, play, clear, playMode },
  },
  share: { playMode },
  track: { descriptions, description, analysis, spokenItem },

  update: ({ beat }) => {
    if (justChanged($video)) {
      return stop(async () => {
        const descriptionModule = await import(video.descriptionPath).then(beat)
        ;({ descriptions, analysis } = descriptionModule.default)
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
      if (justChanged($voice.$playMode, "ended") && spokenItem === analysis) {
        return "ended"
      }
    })()

    spokenItem = justChanged($videoPlayer.$time, null) && analysis ? analysis : description

    /* Voice */
    {
      const isTimeSeek = last?.time && Math.abs(time - last.time) > 1

      if (spokenItem === analysis) {
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
      element("div")
        .attributes({ class: "wrapping-box" })
        .items(element("div").text(spokenItem.text))
    )
  },
})
