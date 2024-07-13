const getVoiceClip = require("./getVoiceClip")
const getVideoData = require("./getVideoData")
const { githubPreAuthentication, githubPostAuthentication, getUser } = require("./authenticate")

const routeRequest = (req, res) => {
  const url = req.url.split("?")[0]

  if (url === "/api/github-pre-authentication") {
    return githubPreAuthentication(req, res)
  }

  if (url === "/api/github-post-authentication") {
    return githubPostAuthentication(req, res)
  }

  if (url === "/api/user") {
    return getUser(req, res)
  }

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
