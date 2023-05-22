import formatTitle from "../library/formatTitle.js"
import videos from "../songs/songs.js"
import define from "../utilities/define.js"
import { component, fragment, element } from "../utilities/reconciler.js"
import TunesPlayer from "./tunes-player.js"

class RootElement extends HTMLElement {
  constructor() {
    super()
  }

  initializeState = {
    time: undefined,
    playerContent: undefined,
    playlists: undefined,
  }

  initializeActions = ({ stateSetters }) => ({
    fetchPlaylists: async () => {
      const { setPlaylists } = stateSetters
      const playlistListModule = await import(`../playlists/playlist-list.js`)
      const playlistList = playlistListModule.default
      const playlists = await Promise.all(
        playlistList.map(async (playlistPath) => {
          const playlistModule = await import(`../playlists/${playlistPath}/contents.js`)
          return playlistModule.default
        })
      )
      setPlaylists(playlists)
    },
    handleContentClick: (event) => {
      const { playlists } = this.state
      const { setPlayerContent } = stateSetters

      event.preventDefault()
      const videoId = event.target.getAttribute("video-id")
      const playlistId = event.target.getAttribute("playlist-id")
      let playerContent
      if (playlistId && videoId) {
        const playlist = playlists.find((playlist) => playlist.id === playlistId)
        const video = playlist.videos.find((video) => video.id === videoId)
        playerContent = { playlist, video }
      } else if (videoId) {
        playerContent = { video: videos.find((video) => video.id === videoId) }
      } else {
        const playlist = playlists.find((playlist) => playlist.id === playlistId)
        playerContent = { playlist, video: playlist.videos[0] }
      }
      setPlayerContent(playerContent)

      // Wait for Player to appear, it starts out display none
      setTimeout(() => {
        this.playerH2.focus()
        this.playerH2.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 1)
    },
  })

  async connectedCallback() {
    const { fetchPlaylists } = this.actions
    await fetchPlaylists()
  }

  reactiveTemplate() {
    const { handleContentClick } = this.actions
    const { playerContent, playlists } = this.state

    return fragment(
      element("div")
        .attributes({ class: "content-container" })
        .children(
          element("h1").children("Tunes"),
          element("p").children(
            "The Tunes project implements audio descriptions for music videos, which are written by some guy named Alex."
          ),
          element("nav").children(
            playlists
              ? element("div")
                  .reconcilerId("playlistContainer")
                  .children(
                    element("h2").children("Playlists"),
                    element("ul").children(
                      ...playlists.map((playlist) => {
                        return element("li").children(
                          element("h3").children(
                            element("a")
                              .attributes({ href: "#", "playlist-id": playlist.id })
                              .listeners({ click: handleContentClick })
                              .children(playlist.title)
                          ),
                          element("ul").children(
                            ...playlist.videos.map((video) => {
                              return element("li").children(
                                element("a")
                                  .attributes({
                                    href: "#",
                                    "playlist-id": playlist.id,
                                    "video-id": video.id,
                                  })
                                  .listeners({ click: handleContentClick })
                                  .children(formatTitle(video, { titleStyle: "listenable" }))
                              )
                            })
                          )
                        )
                      })
                    )
                  )
              : null,
            element("h2").children("Other Songs"),
            element("ul").children(
              ...videos.map((video) => {
                const isActive = video.id === playerContent?.video?.id
                return element("li").children(
                  element("a")
                    .attributes({
                      href: "#",
                      "video-id": video.id,
                      "aria-current": isActive ? true : undefined,
                    })
                    .listeners({ click: handleContentClick })
                    .children(formatTitle(video, { titleStyle: "listenable" }))
                )
              })
            )
          ),
          element("h2")
            .styles({ display: playerContent ? "initial" : "none" })
            .reference(this, "playerH2")
            .attributes({ tabindex: "-1" })
            .children("Player")
        ),
      playerContent
        ? component(TunesPlayer).reconcilerId("tunesPlayer").bindings({ content: playerContent })
        : null
    )
  }
}

define({ RootElement })
