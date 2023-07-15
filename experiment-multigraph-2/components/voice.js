voice = defineModule({
  watch: { voiceSynthesized: { say, clear, pause, play, playMode } },
  receive: { voiceType },
  share: { say, clear, pause, play, playMode },

  update: () => {
    ;({ say, clear, pause, play, playMode } = (() => {
      if (voiceType === "synthesized") return voiceSynthesized
      throw new Error("Unsupported voice type")
    })())
  },
})
