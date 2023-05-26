import formatTitle from "../library/formatTitle.js"
import videos from "../songs/songs.js"
import define from "../utilities/define.js"
import { element } from "../utilities/reconciler.js"

export default class Browser extends HTMLElement {
  constructor() {
    super()
  }

  initializeState = {
    playlists: undefined,
  }

  initializeActions = ({ stateSetters }) => ({
    fetchPlaylists: async () => {
      const { onPlayerContentLoaded } = this.bindings
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
      onPlayerContentLoaded({ playlist: playlists[0], video: playlists[0].videos[0] })
    },
    handleContentClick: async (event) => {
      const { playlists } = this.state
      const { onPlayerContentClicked } = this.bindings

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

      onPlayerContentClicked(playerContent)
    },
  })

  async connectedCallback() {
    const { fetchPlaylists } = this.actions
    await fetchPlaylists()
  }

  reactiveTemplate() {
    const { handleContentClick } = this.actions
    const { playlists } = this.state
    const { playerContent } = this.bindings

    if (!playlists) return null

    return element("nav").children(
      element("div")
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
        ),
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
    )
  }
}

define({ "browser-element": Browser })
