import { define, doOnce, once } from "../utilities/multigraph.js"

define("permissions", {
  receive: { onFirstInteraction },
  share: { firstInteractionComplete, firstInteractionInterceptor },

  update: function ({ change }) {
    firstInteractionComplete = once($firstInteractionComplete, false)

    firstInteractionInterceptor = once($firstInteractionInterceptor, ({ items }) => {
      doOnce(this.$this, () => {
        const listenForFirstInteraction = event => {
          const isKeyDown = event.type === "keydown"

          const interactionInterceptor = document.querySelector(".interaction-interceptor")
          const isVideoPlayerInteraction =
            event.target === interactionInterceptor || interactionInterceptor.contains(event.target)

          this.onFirstInteraction({ isKeyDown, isVideoPlayerInteraction })

          interactionInterceptor.style.display = "none"
          change(() => {
            this.firstInteractionComplete = true
          })

          document.removeEventListener("click", listenForFirstInteraction)
          document.removeEventListener("keydown", listenForFirstInteraction)
        }
        document.addEventListener("click", listenForFirstInteraction)
        document.addEventListener("keydown", listenForFirstInteraction)
      })

      return element("div")
        .attributes({ class: "interaction-interceptor", "tab-index": 0 })
        .items(items)
    })
  },
})
