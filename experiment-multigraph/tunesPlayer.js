import { _, last, justChanged, watched } from "./multigraph/index.js"
import tunesMultigraph from "./tunesMultigraph.js"

tunesMultigraph.define("tunesPlayer", {
  watches: {
    contentBrowser: { video: _, playlist: _ },
    audioDescription: { playMode: _ },
  },
  shares: { video: _ },
  manages: {
    voice: { voiceType: _ },
    videoPlayer: { timeInterval: _ },
  },

  update: () => {
    const { contentBrowser, audioDescription } = watched
    const { video: browserVideo, playlist } = contentBrowser

    const video = (() => {
      if (justChanged(browserVideo)) return browserVideo
      if (justChanged([audioDescription, "playMode"]) && audioDescription.playMode === "ENDED") {
        const currentIndex = playlist.videos.findIndex($ => $.id === browserVideo.id)
        const nextVideo = playlist.videos[currentIndex + 1]
        return nextVideo ?? last.video
      }
    })()

    return {
      shares: { video },
      manages: {
        voice: { voiceType: "synthesized" },
        videoPlayer: { timeInterval: 400 },
      },
    }
  },
})
