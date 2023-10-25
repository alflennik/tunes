import formatTitle from "../library/formatTitle.js"
import rawOtherVideos from "../../videos/videos.js"
import { define, element, reconcile } from "../utilities/multigraph.js"

const otherVideos = rawOtherVideos.map(video => ({
  ...video,
  titleSentence: formatTitle(video, { titleStyle: "standard" }),
}))

define("contentBrowser", {
  watch: {
    tunesPlayer: { video: { id }, playContent },
  },
  receive: { playlists },
  share: { ui },

  update: function () {
    ui = reconcile(
      $ui,
      element("content-browser").items(
        element("h2").text("Playlists"),
        ...playlists.map(playlist =>
          // TODO: use fragment
          element("div").items(
            element("h3").items(
              element("a")
                .attributes({ href: "#" })
                .listeners({
                  click: event => {
                    event.preventDefault()
                    this.playContent({ playlist })
                  },
                })
                .text(playlist.title)
            ),
            element("ul").items(
              ...playlist.videos.map(video => {
                const isActive = video.id === tunesPlayer.video.id
                return element("li").items(
                  element("a")
                    .attributes({ href: "#", "aria-current": isActive ? true : undefined })
                    .listeners({
                      click: event => {
                        event.preventDefault()
                        this.playContent({ playlist, video })
                      },
                    })
                    .text(video.titleSentence)
                )
              })
            )
          )
        ),
        element("h2").text("Other Songs"),
        element("ul").items(
          ...otherVideos.map(video => {
            const isActive = video.id === tunesPlayer.video.id
            return element("li").items(
              element("a")
                .attributes({ href: "#", "aria-current": isActive ? true : undefined })
                .listeners({
                  click: event => {
                    event.preventDefault()
                    this.playContent({ video })
                  },
                })
                .text(video.titleSentence)
            )
          })
        )
      )
    )
  },
})
