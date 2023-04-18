/**
 * Go to the playlist page in Chrome and paste this code into the console.
 */

while (true) {
  const spinner = document
    .querySelector("[page-subtype=playlist] > ytd-two-column-browse-results-renderer")
    .shadowRoot.querySelector("ytd-section-list-renderer")
    .shadowRoot.querySelector("ytd-item-section-renderer")
    .shadowRoot.querySelector("ytd-playlist-video-list-renderer")
    .shadowRoot.querySelector("ytd-continuation-item-renderer")
  if (!spinner) break
  spinner.scrollIntoView({ behavior: "smooth" })
  await new Promise((resolve) => setTimeout(resolve, 1000))
}

// Keeps copy() function from working!
Array.from(document.querySelectorAll("#copy")).forEach((copyElement) => {
  copyElement.remove()
})

copy(
  JSON.stringify(
    Array.from(
      document
        .querySelector("[page-subtype=playlist] > ytd-two-column-browse-results-renderer")
        .shadowRoot.querySelector("ytd-section-list-renderer")
        .shadowRoot.querySelector("ytd-item-section-renderer")
        .shadowRoot.querySelector("ytd-playlist-video-list-renderer")
        .shadowRoot.querySelectorAll("ytd-playlist-video-renderer")
    )
      .map((vid) => vid.shadowRoot)
      .map((vid) => {
        const id = vid
          .querySelector("#video-title")
          .getAttribute("href")
          .match(/\/watch\?v=([a-zA-Z0-9_-]+)&/)[1]
        const title = vid.querySelector("#video-title").innerText
        const channel = vid
          .querySelector("ytd-video-meta-block")
          .shadowRoot.querySelector("ytd-channel-name")
          .shadowRoot.querySelector("yt-formatted-string")
          .shadowRoot.querySelector("a").innerText
        const thumbnail = vid
          .querySelector("ytd-thumbnail")
          .shadowRoot.querySelector("img")
          .getAttribute("src")
        const duration = vid
          .querySelector("ytd-thumbnail")
          .shadowRoot.querySelector("ytd-thumbnail-overlay-time-status-renderer")
          .shadowRoot.querySelector("#text").innerText
        return { id, title, channel, duration, thumbnail }
      }),
    null,
    2
  )
)

console.log("video data has been copied to your clipboard")
