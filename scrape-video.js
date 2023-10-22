/* 
Instructions:

- Go to the video page on YouTube.
- Play the video on the highest quality (needed to capture video dimensions.)
- Paste the code below into the console.
*/

;(() => {
  const youtubeWidth = document.querySelector("video").videoWidth
  const youtubeHeight = document.querySelector("video").videoHeight
  const date = new Date(
    Date.parse(
      document
        .querySelector("tp-yt-paper-tooltip[for=info] #tooltip")
        .innerText.match(/•\s*(?:Premiered )?(\w{3} \d{1,2}, \d{4})/)[1]
    )
  )
    .toISOString()
    .substring(0, 10)

  const id = document.location.href.match(/v=(.+?)&/)[1]

  const thumbnailSrc = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`

  const output = {
    // id,
    date,
    thumbnailSrc,
    youtubeWidth,
    youtubeHeight,
  }
  console.log(output)
  copy(output)
  console.log("✅ Copied to clipboard")
})()
