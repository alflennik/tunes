import formatTitle from "../library/formatTitle.js"
import rawOtherVideos from "../../videos/videos.js"
import { define, render } from "../utilities/multigraph.js"

const otherVideos = rawOtherVideos.map(video => ({
  ...video,
  titleSentence: formatTitle(video, { titleStyle: "standard" }),
}))

define("bootstrap", {
  watch: { contentBrowser, tunesPlayer, videoPlayer, audioDescription },
  manage: {
    tunesPlayer: { playlists, otherVideos },
    contentBrowser: { playlists, otherVideos },
    urls: { playlists, otherVideos },
  },

  updateFirst: function ({ stop, change }) {
    if ($this.isInitialRender) {
      return stop(async () => {
        const playlistListModule = await import("../../playlists/playlist-list.js")
        const playlistList = playlistListModule.default
        const playlists = await Promise.all(
          playlistList.map(async playlistPath => {
            const playlistModule = await import(`../../playlists/${playlistPath}/contents.js`)
            const playlist = playlistModule.default
            return {
              ...playlist,
              videos: playlist.videos.map(video => ({
                ...video,
                titleSentence: formatTitle(video, { titleStyle: "standard" }),
              })),
            }
          })
        )

        await change(() => {
          this.tunesPlayer.playlists = playlists
          this.tunesPlayer.otherVideos = otherVideos
          this.contentBrowser.playlists = playlists
          this.contentBrowser.otherVideos = otherVideos
        })

        // Must render next to attach the root ui and set the first video
        await render(this.$tunesPlayer)

        // Now all units can render
      })
    }
  },
})
