bootstrap = defineModule({
  watch: { contentBrowser, tunesPlayer, videoPlayer, audioDescription },

  updateFirst: function ({ stop }) {
    if (!last) {
      return stop(async () => {
        // Loads initial content
        await render(this.$contentBrowser)

        // Attaches the rootContent and sets the first video
        await render(this.$tunesPlayer)

        // Components which require a video to be set
        await Promise.all([
          // Requires rootContent to be attached
          render(this.$videoPlayer),
          render(this.$audioDescription),
        ])

        // Now all component can render
      })
    }
  },
})
