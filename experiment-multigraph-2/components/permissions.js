permissions = defineModule({
  receive: { onFirstInteraction },
  share: { firstInteractionComplete, firstInteractionInterceptor },
  content: { firstInteractionInterceptor },

  update: ({ beat }) => {
    if (!last) firstInteractionComplete = false

    if (justAttached($firstInteractionInterceptor)) {
      const listenForFirstInteraction = event => {
        beat()
        const isKeyDown = event.type === "keydown"

        const interactionInterceptor = document.querySelector(".interaction-interceptor")
        const isVideoPlayerInteraction =
          event.target === interactionInterceptor || interactionInterceptor.contains(event.target)

        onFirstInteraction({ isKeyDown, isVideoPlayerInteraction })

        interactionInterceptor.style.display = "none"
        firstInteractionComplete = true

        document.removeEventListener("click", listenForFirstInteraction)
        document.removeEventListener("keydown", listenForFirstInteraction)
      }
      document.addEventListener("click", listenForFirstInteraction)
      document.addEventListener("keydown", listenForFirstInteraction)
    }

    firstInteractionInterceptor = reconcile(
      $firstInteractionInterceptor,
      element("div")
        .attributes({ class: "interaction-interceptor", "tab-index": 0 })
        .items(element("button").text(`Play ${video.title()}`))
    )
  },
})
