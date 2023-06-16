import { _, last, stop, once, complete, completed, justCompleted } from "./multigraph/index.js"
import tunesMultigraph from "./tunesMultigraph.js"
import fetchPlaylists from "../stops/fetchPlaylists.js"

tunesMultigraph.define("contentBrowser", {
  stops: { fetchPlaylists: _ },
  watches: {
    tunesPlayer: { video: _ },
  },
  shares: { playlists: _, playlist: _, video: _, select: _ },

  update: () => {
    if (!last) return stop("fetchPlaylists", () => fetchPlaylists({ complete }))

    const playlists = completed("fetchPlaylists")

    const select = once(() => ({ playlist, video }) => {
      complete("select", { playlist, video: video ?? playlist?.videos[0] })
    })

    const { playlist, video } = (() => {
      if (justCompleted("select")) return completed("select")
      if (last) return last
      const playlist = playlists.find($ => !$.needsContentAdvisory)
      return { playlist, video: playlist.videos[0] }
    })()

    return { shares: { playlists, playlist, video, select } }
  },
})

export default contentBrowser
