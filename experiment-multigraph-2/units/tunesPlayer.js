import { define, justChanged, once, reconcile } from "../utilities/multigraph.js"

define("tunesPlayer", {
  watch: {
    audioDescription: { playMode, content },
    contentBrowser: {
      video: { id },
      playlist: { videos },
      content,
    },
    videoPlayer: { play, content },
    voiceSynthesized: { getPermissions },
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
    video = (() => {
      if (justChanged($contentBrowser.$video)) return contentBrowser.video
      if (justChanged($audioDescription.$playMode, "ended")) {
        const currentIndex = playlist.videos.findIndex(each => each.id === contentBrowser.video.id)
        const nextVideo = playlist.videos[currentIndex + 1]
        return nextVideo ?? $video.last
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
      fragment(
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
        firstInteractionInterceptor({
          items: element("button").text(`Play ${video.title}`),
        }),
        element("div")
          .attributes({ "aria-hidden": firstInteractionComplete ? undefined : true })
          .items(videoPlayer.content),
        audioDescription.content
      )
    )

    doOnce($rootContent, () => {
      document.body.appendChild(rootContent)
    })
  },
})
