const getVoiceClip = require("./getVoiceClip")

const routeRequest = (req, res) => {
  if (req.url === "/api/voice") {
    return getVoiceClip(req, res)
  }

  res.statusCode = 404
  res.end("API route not found")
}

module.exports = routeRequest
