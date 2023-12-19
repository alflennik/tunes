define("video", "playlist", "playContent", function () {
  doOnce($this, () => {
    if (location.hash) {
      const onRenderedWholeApp = callback => change(() => {}).then(callback)

      onRenderedWholeApp(() => {
        document.querySelector("#player-h2").focus({ preventScroll: true })
        document
          .querySelector("tunes-player")
          .scrollIntoView({ behavior: "instant", block: "start" })
      })

      const videoId = location.hash.substring(1)
      const otherVideo = this.otherVideos.find(video => video.id === videoId)
      if (otherVideo) {
        this.video = otherVideo
        return
      }

      for (const eachPlaylist of this.playlists) {
        for (const eachVideo of eachPlaylist.videos) {
          if (eachVideo.id === videoId) {
            this.playlist = eachPlaylist
            this.video = eachVideo
            return
          }
        }
      }
    }

    // Cannot show a playlist with a content advisory by default because it would bypass the
    // permission dialog
    this.playlist = playlists.find(each => !each.needsContentAdvisory)
    this.video = playlist.videos[0]
  })

  this.playContent = once($playContent, async ({ playlist, video }) => {
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
    document.querySelector("tunes-player").scrollIntoView({ behavior: "smooth", block: "start" })
    this.videoPlayer.play()
  })

  justChanged($audioDescription.$playMode, () => {
    if (!this.playlist || audioDescription.playMode !== "ended") return

    const currentIndex = this.playlist.videos.findIndex(each => each.id === video.id)
    const nextVideo = this.playlist.videos[currentIndex + 1]

    if (nextVideo) this.video = nextVideo
  })
})
