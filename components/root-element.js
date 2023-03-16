import songs from "../songs/songs.js"
import define from "../utilities/define.js"
import { component, fragment, element } from "../utilities/fun-html.js"
import DescriptionPlayer from "./description-player.js"

class RootElement extends HTMLElement {
  constructor() {
    super()
  }
  reactiveTemplate() {
    return fragment(
      element("nav")(element("ul")(...songs.map((song) => element("li")(song.title)))),
      element("main")(component(DescriptionPlayer).setBindings({ song: songs[0] }))
    )
  }
}

define({ RootElement })
