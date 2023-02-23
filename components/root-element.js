import define from "../utilities/define.js"
import { h1, main, component, p, fragment, style } from "../utilities/fun-html.js"
import DescriptionPlayer from "./description-player.js"

class RootElement extends HTMLElement {
  constructor() {
    super()
  }
  reactiveTemplate() {
    return fragment(
      style(
        `@media (max-width: 400px) {
          body {
            opacity: 0.03;
          }
        }`
      ),
      main(
        h1("Description Player"),
        p("Hit play on the YouTube player to start the audio description."),
        component(DescriptionPlayer)
      )
    )
  }
}

define({ RootElement })
