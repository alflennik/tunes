// TODO: check for and remove videos where embedding is disabled

const fs = require("node:fs/promises")
const path = require("node:path")
const fetch = require("node-fetch")

const getFullContent = async () => {
  const apiKey = await (
    await fs.readFile(path.resolve(__dirname, "secretYouTubeKey.txt"), { encoding: "utf-8" })
  ).trim()

  const playlistQuery =
    `https://www.googleapis.com/youtube/v3/playlists?key=${apiKey}` +
    `&channelId=UCTQLXcdA0UG8h6DeTZUpShQ&part=id,contentDetails,snippet&maxResults=50`

  const getPlaylistItemsQuery = (playlistId, pageToken = null) =>
    `https://www.googleapis.com/youtube/v3/playlistItems?key=${apiKey}` +
    `&playlistId=${playlistId}&part=contentDetails&maxResults=50` +
    `${pageToken ? `&pageToken=${pageToken}` : ""}`

  const getVideoItemsQuery = videoIds =>
    `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoIds.join(",")}` +
    `&maxResults=50&part=snippet,status,contentDetails,id,liveStreamingDetails,localizations,` +
    `player,snippet,statistics,status&maxHeight=8192&maxWidth=8192`

  const allPlaylists = await (await fetch(playlistQuery)).json()

  let videoIds = []

  const playlistIds = allPlaylists.items
    .filter(playlist => {
      return playlist.snippet.title.match(/Tunes Part \d+/) !== null
    })
    .map(playlist => playlist.id)

  for (const playlistId of playlistIds) {
    let maxPages = 30
    let i = 0

    const recursivelyGetNextPage = async (nextPageToken = null) => {
      if (i > maxPages) throw new Error("Runaway loop")

      const itemsRequest = await fetch(getPlaylistItemsQuery(playlistId, nextPageToken))
      const itemsResponse = await itemsRequest.json()

      videoIds.push(...itemsResponse.items.map(item => item.contentDetails.videoId))

      if (itemsResponse.nextPageToken) {
        i += 1
        await recursivelyGetNextPage(itemsResponse.nextPageToken)
      }
    }

    await recursivelyGetNextPage()
  }

  const getDuration = string => {
    const match = string.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
    let seconds = 0
    if (match[1]) seconds += Number(match[1]) * 60 * 60
    if (match[2]) seconds += Number(match[2]) * 60
    if (match[3]) seconds += Number(match[3])
    return seconds
  }

  const removeConsecutiveSpaces = string => {
    // A surprising number of videos have extra spaces in the title, but due to HTML whitespace
    // rules they were never shown to the artists' teams and therefore were never fixed
    return string.replace(/ +/g, " ")
  }

  const videos = []

  for (let i = 0; i < videoIds.length; i += 50) {
    const queryVideoIds = videoIds.slice(i, i + 50)
    const videosRequest = await fetch(getVideoItemsQuery(queryVideoIds))
    const videosResponse = await videosRequest.json()
    videos.push(
      ...videosResponse.items.map(video => ({
        id: video.id,
        publishedAt: video.snippet.publishedAt,
        durationSeconds: getDuration(video.contentDetails.duration),
        aspectRatio: Number(video.player.embedWidth) / Number(video.player.embedHeight),
        channel: video.snippet.channelTitle,
        title: removeConsecutiveSpaces(video.localizations?.en?.title || video.snippet.title),
        hasCaptions:
          video.contentDetails.caption === true || video.contentDetails.caption === "true",
        defaultLanguage: video.snippet.defaultLanguage ?? null,
        defaultAudioLanguage: video.snippet.defaultAudioLanguage ?? null,
        supportsEmbedding: video.status.embeddable,
        // Order of size
        thumbnailSrc: (
          video.snippet.thumbnails.maxres ||
          video.snippet.thumbnails.standard ||
          video.snippet.thumbnails.high ||
          video.snippet.thumbnails.medium ||
          video.snippet.thumbnails.default
        ).url,
        viewCounts: [
          {
            collectedAt: new Date().toISOString(),
            viewCount: video.statistics.viewCount,
          },
        ],
        tags: video.snippet.tags,
      }))
    )
  }

  await fs.writeFile(path.resolve(__dirname, "fullContent.json"), JSON.stringify(videos, null, 2), {
    encoding: "utf-8",
  })
}

getFullContent()
