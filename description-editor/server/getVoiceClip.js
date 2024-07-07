const fetch = require("node-fetch")
const fs = require("node:fs/promises")
const path = require("node:path")

const secretAzureKeyPromise = fs
  .readFile(path.resolve(__dirname, "secretAzureKey.txt"), { encoding: "utf8" })
  .then(key => key.trim())

const getVoiceClip = async (req, res) => {
  if (req.rawBody.length > 1000) {
    res.statusCode = 400
    res.end("Provided SSML is too long")
    return
  }

  const secretAzureKey = await secretAzureKeyPromise

  const fetchResponse = await fetch(
    "https://eastus.tts.speech.microsoft.com/cognitiveservices/v1",
    {
      method: "POST",
      headers: {
        "X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm",
        "Content-Type": "application/ssml+xml",
        "Ocp-Apim-Subscription-Key": secretAzureKey,
      },
      body: req.rawBody,
    }
  )

  res.writeHead(fetchResponse.status, {
    "Content-Type": fetchResponse.headers.get("content-type"),
  })

  // https://stackoverflow.com/a/76959277/3888572
  fetchResponse.body.pipe(res)
}

module.exports = getVoiceClip
