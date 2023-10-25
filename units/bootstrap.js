import formatTitle from "../library/formatTitle.js"
import { define, render } from "../utilities/multigraph.js"

define("bootstrap", {
  watch: { contentBrowser, tunesPlayer, videoPlayer, audioDescription },
  manage: {
    tunesPlayer: { playlists },
    contentBrowser: { playlists },
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
          this.contentBrowser.playlists = playlists
        })

        // Must render next to attach the root ui and set the first video
        await render(this.$tunesPlayer)

        // Now all units can render
      })
    }
  },
})
