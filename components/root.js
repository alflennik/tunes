import define from "../utilities/define.js"
import { component, fragment, element } from "../utilities/reconciler.js"
import TunesPlayer from "./tunes-player.js"
import Browser from "./browser.js"

class Root extends HTMLElement {
  constructor() {
    super()
  }

  initializeState = {
    playerContent: undefined,
  }

  initializeActions = ({ stateSetters }) => ({
    onPlayerContentClicked: async (playerContent) => {
      const { setPlayerContent } = stateSetters

      setPlayerContent(playerContent)

      await new Promise((resolve) => {
        const intervalId = setInterval(() => {
          const { tunesPlayer } = this

          if (!(tunesPlayer && tunesPlayer.state.isReady)) return

          this.playerH2.focus()
          this.tunesPlayer.scrollIntoView({ behavior: "smooth", block: "start" })
          this.tunesPlayer.actions.play()
          clearInterval(intervalId)
          resolve()
        }, 40)
      })
    },
    onPlayerContentLoaded: (playerContent) => {
      const { setPlayerContent } = stateSetters

      setPlayerContent(playerContent)
    },
  })

  reactiveTemplate() {
    const { playerContent } = this.state
    const { onPlayerContentLoaded, onPlayerContentClicked } = this.actions

    return fragment(
      element("div")
        .attributes({ class: "content-container" })
        .children(
          element("h1").children("Tunes"),
          element("p").children(
            "The Tunes project implements audio descriptions for music videos, which are written by some guy named Alex."
          ),
          component(Browser).bindings({
            playerContent,
            onPlayerContentLoaded,
            onPlayerContentClicked,
          }),
          element("h2")
            .styles({ display: playerContent ? "initial" : "none" })
            .reference(this, "playerH2")
            .attributes({ tabindex: "-1" })
            .children("Player")
        ),
      playerContent
        ? component(TunesPlayer)
            .reconcilerId("tunesPlayer")
            .reference(this, "tunesPlayer")
            .bindings({ content: playerContent })
        : null
    )
  }
}

define({ "root-element": Root })
