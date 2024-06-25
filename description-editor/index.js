const http = require("node:http")
const fs = require("node:fs/promises")
const path = require("node:path")

const port = 8999

const server = http.createServer(async (req, res) => {
  const getClientPath = () => {
    const url = req.url.endsWith("/") ? `${req.url}index.html` : req.url

    if (url.startsWith("/video-channels/")) {
      return path.join(__dirname, "../video-channels", url.slice(16))
    }
    return path.join(__dirname, "./client", url)
  }

  let isClientFile
  try {
    await fs.access(getClientPath(), fs.constants.F_OK)
    isClientFile = true
  } catch {
    isClientFile = false
  }

  if (isClientFile) {
    const clientPath = getClientPath()
    const content = await fs.readFile(clientPath, { encoding: "utf8" })

    if (clientPath.endsWith("js")) {
      res.setHeader("Content-Type", "text/javascript")
    } else if (clientPath.endsWith("html") || clientPath.endsWith("/")) {
      res.setHeader("Content-Type", "text/html")
    } else {
      res.statusCode(500)
      res.end()
      throw new Error("Please add mime type")
    }

    res.statusCode = 200
    res.end(content)

    return
  }

  res.statusCode = 404
  res.setHeader("Content-Type", "text/html")
  res.end(`<h1>404</h1>`)
})

server.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`)
})
