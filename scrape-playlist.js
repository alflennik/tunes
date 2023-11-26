/**
 * Go to the playlist page in Chrome and paste this code into the console.
 */

while (true) {
  const spinner = document.querySelector(
    "ytd-playlist-video-list-renderer ytd-continuation-item-renderer"
  )
  if (!spinner) break
  spinner.scrollIntoView({ behavior: "smooth" })
  await new Promise(resolve => setTimeout(resolve, 1000))
}

// Keeps copy() function from working!
Array.from(document.querySelectorAll("#copy")).forEach(copyElement => {
  copyElement.remove()
})

copy(
  JSON.stringify(
    Array.from(
      document.querySelectorAll("ytd-playlist-video-list-renderer ytd-playlist-video-renderer")
    ).map(vid => {
      const id = vid
        .querySelector("#video-title")
        .getAttribute("href")
        .match(/\/watch\?v=([a-zA-Z0-9_-]+)&/)[1]
      const title = vid.querySelector("#video-title").innerText
      const channel = vid.querySelector("ytd-channel-name").innerText
      const thumbnail = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
      const duration = vid
        .querySelector("ytd-thumbnail-overlay-time-status-renderer")
        .innerText.trim()
      return { id, title, channel, duration, thumbnail }
    }),
    null,
    2
  )
)

console.info("video data has been copied to your clipboard")
