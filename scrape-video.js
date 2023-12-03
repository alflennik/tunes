/* 
Instructions:

- Go to the video page on YouTube.
- Play the video on the highest quality (needed to capture video dimensions.)
- Paste the code below into the console.
*/

;(() => {
  const width = document.querySelector("video").videoWidth
  const height = document.querySelector("video").videoHeight
  const date = new Date(
    Date.parse(
      document
        .querySelector("tp-yt-paper-tooltip.ytd-watch-info-text #tooltip")
        .innerText.match(/•\s*(?:Premiered )?(\w{3} \d{1,2}, \d{4})/)[1]
    )
  )
    .toISOString()
    .substring(0, 10)

  const duration = document.querySelector(".ytp-time-duration").innerText

  const id = document.location.href.match(/v=(.+?)&/)[1]

  const thumbnailSrc = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`

  const channel = document.querySelector(".ytd-video-owner-renderer .ytd-channel-name a").innerText

  const title = document.querySelector("#title h1").innerText

  const output = {
    youtubeVideo: {
      id,
      date,
      duration,
      width,
      height,
      channel,
      title,
    },
    thumbnailSrc,
  }
  console.log(output)
  copy(`${JSON.stringify(output, null, "  ")},`)
  console.log("✅ Copied to clipboard")
})()
