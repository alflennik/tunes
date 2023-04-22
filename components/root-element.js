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
      element("nav").children(
        element("ul").children(
          ...songs.map((song) => {
            const isActive = song.id === playerSong.id
            return element("li").children(
              element("a")
                .attributes({
                  href: "#",
                  "song-id": song.id,
                  "aria-current": isActive ? true : undefined,
                })
                .listeners({ click: handleSongClick })
                .children(song.title)
            )
          })
        )
      ),
      element("main").children(component(TunesPlayer).bindings({ song: playerSong }))
    )
  }
}

define({ RootElement })
