import { define, justChanged, once, doOnce, reconcile, element } from "../utilities/multigraph.js"

define("tunesPlayer", {
  watch: {
    audioDescription: { isPrerecorded, playMode, content },
    contentBrowser: {
      video: { id, titleSentence },
      playlist: { videos },
      content,
    },
    videoPlayer: { play, content },
    voiceSynthesized: { getPermissions },
    voicePrerecorded: { getPermissions },
    permissions: { firstInteractionInterceptor, firstInteractionComplete },
  },
  share: { video: { id, titleSentence, descriptionPath, youtubeId } },
  manage: {
    voice: { voiceType },
    videoPlayer: { timeInterval },
    permissions: { onFirstInteraction },
  },
  track: { rootContent },

  update: function () {
    /* video */
    if (justChanged($contentBrowser.$video)) {
      video = contentBrowser.video
    } else if (justChanged($audioDescription.$playMode, "ended")) {
      const currentIndex = playlist.videos.findIndex(each => each.id === contentBrowser.video.id)
      const nextVideo = playlist.videos[currentIndex + 1]
      video = nextVideo ?? $video.lastValue
    }

    voice.voiceType = isPrerecorded ? "prerecorded" : "synthesized"

    videoPlayer.timeInterval = once($timeInterval, 400)

    permissions.onFirstInteraction = once(
      $onFirstInteraction,
      async ({ isKeyDown, isVideoPlayerInteraction }) => {
        await this.voiceSynthesized.getPermissions()
        await this.voicePrerecorded.getPermissions()
        if (!isKeyDown && isVideoPlayerInteraction) this.videoPlayer.play()
      }
    )

    rootContent = reconcile(
      $rootContent,
      element("root-element").items(
        element("div")
          .attributes({ class: "content-container" })
          .items(
            element("h1").text("Tunes"),
            element("p").text(
              "The Tunes project implements audio descriptions for music videos, which are written by some guy named Alex."
            ),
            contentBrowser.content,
            element("h2").attributes({ id: "player-h2", tabindex: "-1" }).text("Player")
          ),
        element("tunes-player").items(
          firstInteractionInterceptor?.({
            items: element("button").text(`Play ${video.titleSentence}`),
          }),
          element("video-player")
            .attributes({ "aria-hidden": firstInteractionComplete ? undefined : true })
            .items(videoPlayer.content),
          audioDescription.content
        )
      )
    )

    doOnce($rootContent, () => {
      document.body.appendChild(rootContent.element)
    })
  },
})
