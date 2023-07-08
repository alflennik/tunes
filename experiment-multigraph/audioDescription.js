import { _, stop, complete, justChanged, watched, identity } from "./multigraph/index.js"
import tunesMultigraph from "./tunesMultigraph.js"

tunesMultigraph.define("audioDescription", {
  stops: { fetchDescription: _ },
  watches: {
    tunesPlayer: { video: _ },
    videoPlayer: { playMode: _, time: _ },
    voice: { say: _, pause: _, play: _, clear: _, playMode: _ },
  },
  shares: { descriptions: _, description: _, analysis: _, playMode: _, spokenItem: _ },

  update: () => {
    if (justChanged(video)) return stop("fetchDescriptions", () => fetchDescriptions({ complete }))

    const { descriptions, analysis } = completed("fetchDescriptions")
    const { tunesPlayer, videoPlayer } = watched
    const { video } = tunesPlayer
    const { time } = videoPlayer

    const description = descriptions.reverse().find(each => time > each.time)

    const playMode = identity(() => {
      if (justChanged([videoPlayer, "playMode"])) {
        if (videoPlayer.playMode === "PLAYING") {
          return "PLAYING"
        } else if (videoPlayer.playMode === "PAUSED" || videoPlayer.playMode === "BUFFERING") {
          return "PAUSED"
        } else if (videoPlayer.playMode === "ENDED") {
          if (!analysis) return "ENDED"
          return "PLAYING"
        } else {
          throw new Error("Missing case")
        }
      }
      if (justChanged([voice, "playMode"], "ENDED") && last.spokenItem.text === analysis.text) {
        return "ENDED"
      }
      return last.playMode
    })

    const spokenItem = (() => {
      if (justChanged([videoPlayer, "time"], null) && analysis) {
        return analysis
      }
      return description
    })()

    const isTimeSeek = last.time !== null && Math.abs(time - last.time) > 1

    ;(function handleVoice() {
      if (spokenItem.text !== last.spokenItem.text) {
        if (!isTimeSeek) {
          voice.play()
          voice.say(spokenItem)
        } else {
          voice.clear()
        }
      }
      if (justChanged([videoPlayer, "playMode"], "PAUSED")) {
        voice.pause()
      }
    })()

    return {
      shares: { descriptions, description, analysis, spokenItem, playMode },
    }
  },
})
