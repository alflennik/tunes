const getVoiceClip = require("./getVoiceClip")
const getVideoData = require("./getVideoData")

const routeRequest = (req, res) => {
  const url = req.url.split("?")[0]

  if (url === "/api/voice") {
    return getVoiceClip(req, res)
  }

  if (url === "/api/video-data") {
    return getVideoData(req, res)
  }

  res.statusCode = 404
  res.end("API route not found")
}

module.exports = routeRequest
