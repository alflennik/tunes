const getVoiceClip = require("./getVoiceClip")
const getVideoData = require("./getVideoData")
const { githubPreAuthentication, githubPostAuthentication, getUser } = require("./authenticate")
const { save } = require("./persist")

const routeRequest = (req, res) => {
  const url = req.url.split("?")[0]

  if (url === "/api/github-pre-authentication" && req.method === "GET") {
    return githubPreAuthentication(req, res)
  }

  if (url === "/api/github-post-authentication" && req.method === "GET") {
    return githubPostAuthentication(req, res)
  }

  if (url === "/api/user" && req.method === "GET") {
    return getUser(req, res)
  }

  if (url === "/api/voice" && req.method === "POST") {
    return getVoiceClip(req, res)
  }

  if (url === "/api/video-data" && req.method === "GET") {
    return getVideoData(req, res)
  }

  if (url === "/api/save" && req.method === "POST") {
    return save(req, res)
  }

  res.statusCode = 404
  res.end("API route not found")
}

module.exports = routeRequest
