import { define, justChanged, once, doOnce, reconcile, element } from "../utilities/multigraph.js"

define("tunesPlayer", {
  watch: {
    audioDescription: { isPrerecorded, playMode, ui },
    contentBrowser: { ui },
    videoPlayer: { play, ui },
    voiceSynthesized: { getPermissions },
    voicePrerecorded: { getPermissions },
    permissions: { firstInteractionInterceptor, firstInteractionComplete },
  },
  share: { video: { id, titleSentence, descriptionPath, youtubeId }, playlist, playContent },
  receive: { playlists },
  manage: {
    voice: { voiceType },
    videoPlayer: { timeInterval },
    permissions: { onFirstInteraction },
  },
  track: { rootUi },

  update: function ({ change }) {
    /* active playlist and video */
    {
      doOnce($this, () => {
        // Cannot show a playlist with a content advisory by default because it would bypass the
        // permission dialog
        playlist = playlists.find(each => !each.needsContentAdvisory)
        video = playlist.videos[0]
      })

      playContent = once($playContent, async ({ playlist, video }) => {
        if (
          playlist?.needsContentAdvisory &&
          !window.confirm(
            "This playlist contains content some viewers might find disturbing, are you sure you " +
              "want to continue?"
          )
        ) {
          return
        }

        await change(() => {
          this.playlist = playlist
          this.video = video ?? playlist?.videos[0]
        })

        document.querySelector("#player-h2").focus({ preventScroll: true })
        document
          .querySelector("tunes-player")
          .scrollIntoView({ behavior: "smooth", block: "start" })
        this.videoPlayer.play()
      })

      if (playlist && justChanged($audioDescription.$playMode, "ended")) {
        const currentIndex = playlist.videos.findIndex(each => each.id === video.id)
        const nextVideo = playlist.videos[currentIndex + 1]
        video = nextVideo ?? $video.lastValue
      }
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
              "--scrollbar-width": window.innerWidth - document.body.clientWidth + "px",
              "--video-width": video.youtubeWidth,
              "--video-height": video.youtubeHeight,
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

    doOnce($rootUi, () => {
      document.body.appendChild(rootUi.element)
    })
  },
})
