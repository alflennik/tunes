const http = require("node:http")
const fs = require("node:fs/promises")
const createReadStream = require("fs").createReadStream
const path = require("node:path")
const routeRequest = require("./server/router")

const port = 8999

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith("/api/")) {
    const rawBody = await new Promise((resolve, reject) => {
      let body = ""

      req.on("data", chunk => {
        body += chunk
      })

      req.on("end", () => {
        resolve(body)
      })

      req.on("error", err => {
        reject(err)
      })
    })

    req.rawBody = rawBody

    return routeRequest(req, res)
  }

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

    const isBinaryFile = clientPath.endsWith(".wasm") || clientPath.endsWith(".mp3")

    if (isBinaryFile) {
      if (clientPath.endsWith(".wasm")) {
        res.setHeader("Content-Type", "application/wasm")
      } else if (clientPath.endsWith(".mp3")) {
        res.setHeader("Content-Type", "application/mpeg")
      }
      res.statusCode = 200
      const stream = createReadStream(clientPath)
      stream.pipe(res)
      return
    }

    let text = await fs.readFile(clientPath, { encoding: "utf8" })

    if (clientPath.endsWith("js")) {
      res.setHeader("Content-Type", "text/javascript")
    } else if (clientPath.endsWith(".html") || clientPath.endsWith("/")) {
      res.setHeader("Content-Type", "text/html")
    } else if (clientPath.endsWith(".map")) {
      res.setHeader("Content-Type", "application/json")
    } else {
      res.statusCode = 500
      res.end()
      throw new Error(`Please add mime type for ${clientPath}`)
    }

    res.statusCode = 200
    res.end(text)

    return
  }

  res.statusCode = 404
  res.setHeader("Content-Type", "text/html")
  res.end(`<h1>404</h1>`)
})

server.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`)
})
