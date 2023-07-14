define({ audioDescription })({
  watch: {
    tunesPlayer: { video: { descriptionPath } },
    videoPlayer: { playMode, time },
    voice: { say, pause, play, clear, playMode },
  },
  share: { playMode },
  track: { descriptions, description, analysis, spokenItem },

  update: ({ _ }) => {
    if (justChanged(video)) {
      return stop(async () => {
        const descriptionModule = await import(_.video.descriptionPath)
        _.set(_.descriptions, _.analysis)(descriptionModule.default)
      })
    }

    set(description)(descriptions.reverse().find(each => $time > each.$time))

    set(playMode).by(() => {
      if (justChanged(videoPlayer.playMode)) {
        switch (videoPlayer.$playMode) {
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
      if (justChanged(voice.playMode, "ended") && equivalent(spokenItem, analysis)) {
        return "ended"
      }
    })

    set(spokenItem)(justChanged(videoPlayer.time, null) && analysis ? analysis : description)

    section("voice").by(() => {
      const isTimeSeek = last?.$time && Math.abs($time - last.$time) > 1

      if (equivalent(spokenItem, analysis)) {
        if (!isTimeSeek) {
          voice.play()
          voice.say(spokenItem)
        } else {
          voice.clear()
        }
      }
      if (justChanged(videoPlayer.playMode, "paused")) {
        voice.pause()
      }
    })

    reconcile(content)(
      element("div")
        .attributes({ class: "wrapping-box" })
        .items(element("div").text(spokenItem.text))
    )
  },
})
