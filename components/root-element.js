import formatTitle from "../library/formatTitle.js"
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

      this.playerH2.focus()
      this.playerH2.scrollIntoView({ behavior: "smooth", block: "start" })
    },
  })

  reactiveTemplate() {
    const { handleSongClick } = this.actions
    const { playerSong } = this.state

    return fragment(
      element("div")
        .attributes({ class: "content-container" })
        .children(
          element("h1").children("Tunes"),
          element("p").children(
            "The Tunes project implements audio descriptions for music videos, which are written by some guy named Alex."
          ),
          element("nav").children(
            element("h2").children("All Songs"),
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
                    .children(formatTitle(song, { titleStyle: "listenable" }))
                )
              })
            )
          ),
          element("h2")
            .reference(this, "playerH2")
            .attributes({ tabindex: "-1" })
            .children("Player")
        ),
      component(TunesPlayer).bindings({ song: playerSong })
    )
  }
}

define({ RootElement })
