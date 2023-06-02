import formatTitle from "../library/formatTitle.js"
import videos from "../songs/songs.js"
import define from "../utilities/define.js"
import { element } from "../utilities/reconciler.js"

export default class Browser extends HTMLElement {
  constructor() {
    super()
  }

  initializeState = {
    playlists: undefined
  }

  initializeActions = ({ stateSetters }) => ({
    fetchPlaylists: async () => {
      const { onPlayerContentLoaded } = this.bindings
      const { setPlaylists } = stateSetters

      const playlistListModule = await import(`../playlists/playlist-list.js`)
      const playlistList = playlistListModule.default
      const playlists = await Promise.all(
        playlistList.map(async playlistPath => {
          const playlistModule = await import(`../playlists/${playlistPath}/contents.js`)
          return playlistModule.default
        })
      )
      setPlaylists(playlists)

      const playlist = playlists.find(each => !each.needsContentAdvisory)

      onPlayerContentLoaded({ playlist, video: playlist.videos[0] })
    },
    handleContentClick: async event => {
      const { playlists } = this.state
      const { onPlayerContentClicked } = this.bindings

      event.preventDefault()

      const videoId = event.target.getAttribute("video-id")
      const playlistId = event.target.getAttribute("playlist-id")

      let playerContent
      if (playlistId && videoId) {
        const playlist = playlists.find(playlist => playlist.id === playlistId)
        const video = playlist.videos.find(video => video.id === videoId)
        playerContent = { playlist, video }
      } else if (videoId) {
        playerContent = { video: videos.find(video => video.id === videoId) }
      } else {
        const playlist = playlists.find(playlist => playlist.id === playlistId)
        playerContent = { playlist, video: playlist.videos[0] }
      }

      if (playerContent.playlist?.needsContentAdvisory) {
        if (
          window.confirm(
            "This playlist contains content some viewers might find disturbing, are you sure you want to continue?"
          )
        ) {
          onPlayerContentClicked(playerContent)
        }
      } else {
        onPlayerContentClicked(playerContent)
      }
    }
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

    return element("nav").items(
      element("h2").text("Playlists"),
      element("ul").items(
        ...playlists.map(playlist =>
          element("li").items(
            element("h3").items(
              element("a")
                .attributes({ href: "#", "playlist-id": playlist.id })
                .listeners({ click: handleContentClick })
                .text(playlist.title)
            ),
            element("ul").items(
              ...playlist.videos.map(video =>
                element("li").items(
                  element("a")
                    .attributes({
                      href: "#",
                      "playlist-id": playlist.id,
                      "video-id": video.id
                    })
                    .listeners({ click: handleContentClick })
                    .text(formatTitle(video, { titleStyle: "listenable" }))
                )
              )
            )
          )
        )
      ),
      element("h2").text("Other Songs"),
      element("ul").items(
        ...videos.map(video => {
          const isActive = video.id === playerContent?.video?.id
          return element("li").items(
            element("a")
              .attributes({
                href: "#",
                "video-id": video.id,
                "aria-current": isActive ? true : undefined
              })
              .listeners({ click: handleContentClick })
              .text(formatTitle(video, { titleStyle: "listenable" }))
          )
        })
      )
    )
  }
}

define({ "browser-element": Browser })
