import { _, received } from "./multigraph/index.js"

tunesMultigraph.define("voice", {
  receives: { voiceType: _ },
  shares: { say: _, pause: _, play: _, clear: _, playMode: _ },

  update: () => {
    const { voiceType } = received

    const { say, pause, play, clear, playMode } = (() => {
      if (voiceType === "SYNTHESIZED") {
        return { say, pause, play, clear, playMode }
      } else {
        throw new Error("Unexpected case")
      }
    })()
  },
})
