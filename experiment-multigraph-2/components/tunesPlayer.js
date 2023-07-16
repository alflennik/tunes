tunesPlayer = defineModule({
  watch: {
    audioDescription: { playMode },
    contentBrowser: {
      video: { id },
      playlist: { videos: [{ id }] },
    },
    videoPlayer: { play },
    voiceSynthesized: { getPermissions },
    permissions: { firstInteractionInterceptor, firstInteractionComplete },
  },
  share: { video: { id, titleSentence, descriptionPath, youtubeId } },
  manage: {
    voice: { voiceType },
    videoPlayer: { timeInterval },
    permissions: { onFirstInteraction },
  },

  update: () => {
    video = (() => {
      if (justChanged($contentBrowser.$video)) return contentBrowser.video
      if (justChanged($audioDescription.$playMode, "ended")) {
        const currentIndex = playlist.videos.findIndex(each => each.id === contentBrowser.video.id)
        const nextVideo = playlist.videos[currentIndex + 1]
        return nextVideo ?? last.video
      }
    })()

    voiceType = once($voiceType, "synthesized")

    timeInterval = once($timeInterval, 400)

    onFirstInteraction = once(
      $onFirstInteraction,
      async ({ isKeyDown, isVideoPlayerInteraction }) => {
        await this.voiceSynthesized.getPermissions()
        if (!isKeyDown && isVideoPlayerInteraction) this.videoPlayer.play()
      }
    )

    rootContent = reconcile(
      $rootContent,
      element("div")
        .attributes({ class: "content-container" })
        .items(
          element("h1").text("Tunes"),
          element("p").text(
            "The Tunes project implements audio descriptions for music videos, which are written by some guy named Alex."
          ),
          content(contentBrowser),
          element("h2").attributes({ id: "player-h2", tabindex: "-1" }).text("Player")
        ),
      content(firstInteractionInterceptor),
      element("div")
        .attributes({ "aria-hidden": firstInteractionComplete ? undefined : true })
        .items(content(videoPlayer)),
      content(audioDescription)
    )
  },
})
