define({ tunesPlayer })({
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

  update: ({ _ }) => {
    set(video).by(() => {
      if (justChanged(contentBrowser.video)) return contentBrowser.video
      if (justChanged(audioDescription.playMode, "ended")) {
        const currentIndex = playlist.videos.findIndex(
          each => each.$id === contentBrowser.video.$id
        )
        const nextVideo = playlist.videos[currentIndex + 1]
        return nextVideo ?? last.video
      }
    })

    manage(voiceType).once(() => "synthesized")

    manage(timeInterval).once(() => 400)

    manage(onFirstInteraction).once(() => async ({ isKeyDown, isVideoPlayerInteraction }) => {
      await _.voiceSynthesized.getPermissions()
      if (!isKeyDown && isVideoPlayerInteraction) _.videoPlayer.play()
    })

    reconcile(rootContent)(
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
        .attributes({ "aria-hidden": $firstInteractionComplete ? undefined : true })
        .items(content(videoPlayer)),
      content(audioDescription)
    )
  },
})
