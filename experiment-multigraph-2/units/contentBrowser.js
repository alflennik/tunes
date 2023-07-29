import { define, element, once, reconcile } from "../utilities/multigraph.js"

define("contentBrowser", {
  watch: {
    tunesPlayer: { video: { id, titleSentence } },
  },
  share: {
    playlist: { id, title, videos },
    video: { id, titleSentence },
    content,
  },
  track: { playlists, select },

  update: function ({ stop, ripple }) {
    if ($this.isInitialRender) {
      return stop(async () => {
        const playlistListModule = await import("../../playlists/playlist-list.js")
        const playlistList = playlistListModule.default
        this.playlists = await Promise.all(
          playlistList.map(async playlistPath => {
            const playlistModule = await import(`../../playlists/${playlistPath}/contents.js`)
            return playlistModule.default
          })
        )

        // Cannot show a playlist with a content advisory by default because it would bypass the
        // permission dialog
        this.playlist = this.playlists.find(each => !each.needsContentAdvisory)

        this.video = this.playlist.videos[0]
      })
    }

    select = once($select, async ({ event, playlist, video }) => {
      event.preventDefault()

      if (
        playlist.needsContentAdvisory &&
        !window.confirm(
          "This playlist contains content some viewers might find disturbing, are you sure you " +
            "want to continue?"
        )
      ) {
        return
      }

      await ripple(() => {
        this.playlist = playlist
        this.video = video ?? playlist?.videos[0]
      })

      document.querySelector("#player-h2").focus({ preventScroll: true })
      document.querySelector("tunes-player").scrollIntoView({ behavior: "smooth", block: "start" })
      this.videoPlayer.play()
    })

    content = reconcile(
      $content,
      element("nav").items(
        element("h2").text("Playlists"),
        element("ul").items(
          ...playlists.map(playlist =>
            element("li").items(
              element("h3").items(
                element("a")
                  .attributes({ href: "#" })
                  .listeners({ click: event => select({ event, playlist }) })
                  .text(playlist.title)
              ),
              element("ul").items(
                ...playlist.videos.map(video =>
                  element("li").items(
                    element("a")
                      .attributes({ href: "#" })
                      .listeners({ click: event => select({ event, playlist, video }) })
                      .text(video.titleSentence)
                  )
                )
              )
            )
          )
        ),
        element("h2").text("Other Songs"),
        element("ul").items(
          ...videos.map(video => {
            const isActive = video.id === tunesPlayer.video.id
            return element("li").items(
              element("a")
                .attributes({ href: "#", "aria-current": isActive ? true : undefined })
                .listeners({ click: event => select({ event, playlist, video }) })
                .text(video.titleSentence)
            )
          })
        )
      )
    )
  },
})
