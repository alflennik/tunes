import { define } from "../utilities/multigraph.js"

define("voice", {
  watch: {
    voiceSynthesized: { say, clear, pause, play, playMode },
    voicePrerecorded: { say, clear, pause, play, playMode },
  },
  receive: { voiceType },
  share: { say, clear, pause, play, playMode },

  update: function () {
    ;({ say, clear, pause, play, playMode } = (() => {
      if (voiceType === "synthesized") return voiceSynthesized
      if (voiceType === "prerecorded") return voicePrerecorded
      throw new Error("Unsupported voice type")
    })())
  },
})
