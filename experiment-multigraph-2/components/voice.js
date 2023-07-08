define({ voice })({
  watch: { voiceSynthesized: { say, clear, pause, play } },
  receive: { voiceType },
  share: { say, clear, pause, play },

  update: () => {
    set(say, clear, pause, play).by(() => {
      if ($voiceType === "synthesized") return voiceSynthesized
      throw new Error("Unsupported voice type")
    })
  },
})
