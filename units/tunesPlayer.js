import { define, justChanged, once, doOnce, reconcile, element } from "../utilities/multigraph.js"

define("tunesPlayer", {
  watch: {
    audioDescription: { isPrerecorded, playMode, ui },
    contentBrowser: {
      ui,
      video: { id, titleSentence, youtubeWidth, youtubeHeight },
      playlist: { videos },
    },
    videoPlayer: { play, ui },
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
  track: { rootUi },

  update: function () {
    /* video */
    if (justChanged($contentBrowser.$video)) {
      video = contentBrowser.video
    } else if (playlist && justChanged($audioDescription.$playMode, "ended")) {
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

    rootUi = reconcile(
      $rootUi,
      element("root-element").items(
        element("div")
          .attributes({ class: "content-container" })
          .items(
            element("h1").text("Tunes"),
            element("p").text(
              "The Tunes project implements audio descriptions for music videos, which are written by some guy named Alex."
            ),
            contentBrowser.ui,
            element("h2").attributes({ id: "player-h2", tabindex: "-1" }).text("Player")
          ),
        element("tunes-player").items(
          element("video-player")
            .styles({
              "--video-width": video.youtubeWidth ?? 1920,
              "--video-height": video.youtubeHeight ?? 1080,
            })
            .attributes({ "aria-hidden": firstInteractionComplete ? undefined : true })
            .items(
              firstInteractionInterceptor?.({
                items: element("button").text(`Play ${video.titleSentence}`),
              }),
              videoPlayer.ui
            ),
          audioDescription.ui
        )
      )
    )

    doOnce($Ui, () => {
      document.body.appendChild(rootUi.element)
    })
  },
})
