const fetch = require("node-fetch")
const fs = require("node:fs/promises")
const path = require("node:path")

const secretYouTubeKeyPromise = fs
  .readFile(path.resolve(__dirname, "secretYouTubeKey.txt"), { encoding: "utf8" })
  .then(key => key.trim())

const getVideoData = async (req, res) => {
  const secretYouTubeKey = await secretYouTubeKeyPromise

  const videoIdMatch = req.url.match(/\?videoId=([^&]+)/)
  if (!videoIdMatch) {
    res.statusCode = 400
    res.end('Missing "videoId" query parameter')
    return
  }

  const videoId = videoIdMatch[1]

  const videosRequest = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?key=${secretYouTubeKey}&id=${videoId}` +
      `&maxResults=50&part=snippet,status,contentDetails,id,liveStreamingDetails,localizations,` +
      `player,snippet,statistics,status&maxHeight=8192&maxWidth=8192`
  )
  const videosResponse = await videosRequest.json()

  const video = videosResponse.items[0]

  const videoData = {
    id: videoId,
    aspectRatio: Number(video.player.embedWidth) / Number(video.player.embedHeight),
  }

  return res.end(JSON.stringify(videoData))
}

module.exports = getVideoData
