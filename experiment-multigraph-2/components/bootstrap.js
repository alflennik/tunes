define({ bootstrap })({
  watch: { contentBrowser, tunesPlayer, videoPlayer, audioDescription },

  updateFirst: () => {
    if (!last) {
      return stop(async () => {
        // Loads initial content
        await render(contentBrowser)

        // Attaches the rootContent and sets the first video
        await render(tunesPlayer)

        // Components which require a video to be set
        await Promise.all([
          // Requires rootContent to be attached
          render(videoPlayer),
          render(audioDescription),
        ])

        // Now all component can render
      })
    }
  },
})
