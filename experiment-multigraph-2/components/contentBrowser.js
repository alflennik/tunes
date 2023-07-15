contentBrowser = defineModule({
  watch: {
    tunesPlayer: { video: { id, titleSentence } },
  },
  share: {
    playlist: { id, title, videos: [{ id, titleSentence }] },
    video: { id, titleSentence },
  },
  track: { playlists, select },

  update: ({ beat }) => {
    if (!last) {
      return stop(async () => {
        const playlistListModule = await import("../playlists/playlist-list.js").then(beat)
        const playlistList = playlistListModule.default
        playlists = await Promise.all(
          playlistList.map(async playlistPath => {
            const playlistModule = await beat(import(`../playlists/${playlistPath}/contents.js`))
            return playlistModule.default
          })
        ).then(beat)

        // Cannot show a playlist with a content advisory by default because it would bypass the
        // permission dialog
        playlist = playlists.find(each => !each.needsContentAdvisory)

        video = playlist.videos[0]
      })
    }

    select = onceFn($select, async ({ event, playlist: newPlaylist, video: newVideo }) => {
      event.preventDefault()

      if (
        newPlaylist?.needsContentAdvisory &&
        !window.confirm(
          "This playlist contains content some viewers might find disturbing, are you sure you " +
            "want to continue?"
        )
      ) {
        return
      }

      playlist = newPlaylist
      video = newVideo ?? playlist?.videos[0]

      await ripple()

      document.querySelector("#player-h2").focus({ preventScroll: true })
      elementReference(tunesPlayer).scrollIntoView({ behavior: "smooth", block: "start" })
      videoPlayer.play()
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
