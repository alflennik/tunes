import songs from "../songs/songs.js"
import define from "../utilities/define.js"
import { component, fragment, element } from "../utilities/fun-html.js"
import TunesPlayer from "./tunes-player.js"

class RootElement extends HTMLElement {
  constructor() {
    super()
  }

  initializeState = {
    time: undefined,
    playerSong: songs[0],
  }

  initializeActions = ({ stateSetters }) => ({
    handleSongClick: (event) => {
      const { setPlayerSong } = stateSetters

      event.preventDefault()
      const songId = event.target.getAttribute("song-id")
      const song = songs.find((song) => song.id === songId)
      setPlayerSong(song)
    },
  })

  reactiveTemplate() {
    const { handleSongClick } = this.actions
    const { playerSong } = this.state

    return fragment(
      element("nav")(
        element("ul")(
          ...songs.map((song) => {
            const isActive = song.id === playerSong.id
            return element("li")(
              element("a")
                .setAttributes({
                  href: "#",
                  "song-id": song.id,
                  "aria-current": isActive ? true : undefined,
                })
                .on(
                  "click",
                  handleSongClick
                )(song.title)
            )
          })
        )
      ),
      element("main")(component(TunesPlayer).setBindings({ song: playerSong }))
    )
  }
}

define({ RootElement })
