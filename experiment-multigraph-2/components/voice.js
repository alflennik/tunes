define({ voice })({
  watch: { voiceSynthesized: { say, clear, pause, play, playMode } },
  receive: { voiceType },
  share: { say, clear, pause, play, playMode },

  update: () => {
    set(say, clear, pause, play, playMode).by(() => {
      if ($voiceType === "synthesized") return voiceSynthesized
      throw new Error("Unsupported voice type")
    })
  },
})
