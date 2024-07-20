const fs = require("fs/promises")
const path = require("path")
const { exec } = require("child_process")
const { readCookie } = require("./authenticate")

const githubPATPromise = fs
  .readFile(path.resolve(__dirname, "secretGithubPAT.txt"), { encoding: "utf8" })
  .then(key => key.trim())

const jwtSecretPromise = fs
  .readFile(path.resolve(__dirname, "secretJwt.txt"), { encoding: "utf8" })
  .then(key => key.trim())

const save = async (req, res) => {
  const jwtSecret = await jwtSecretPromise

  const jwt = readCookie({ cookie: req.headers.cookie, jwtSecret })

  if (!jwt) {
    res.statusCode = 401
    res.end(JSON.stringify(null))
  }

  const { username } = jwt

  await loadRepos()

  await getPrivateRepoLock(async () => {
    const repoPath = path.resolve(__dirname, "descriptionRepoPrivate")

    const { videoId, descriptions, captions, duckingTimes } = JSON.parse(req.rawBody)

    await new Promise(resolve => exec("git pull", { cwd: repoPath }, resolve))

    const directory = path.join(repoPath, getDescriptionDirectory({ videoId, username }))

    await fs.mkdir(directory, { recursive: true })

    await fs.writeFile(
      path.join(directory, "description.json"),
      JSON.stringify({ videoId, descriptions, captions, duckingTimes }, null, 2),
      { encoding: "utf8" }
    )

    await new Promise(resolve => exec("git add .", { cwd: repoPath }, resolve))

    if (videoId.match(/^[\w-]$/)) {
      res.statusCode = 400
      res.end("null")
    }

    const message = `${username} edited ${videoId}`
    await new Promise(resolve => exec(`git commit -m "${message}"`, { cwd: repoPath }, resolve))

    await new Promise(resolve => exec("git push", { cwd: repoPath }, resolve))
  })

  res.statusCode = 200
  res.end()
}

const loadRepos = async () => {
  const githubPAT = await githubPATPromise

  const descriptionRepoPublicPath = path.resolve(__dirname, "descriptionRepoPublic")
  const descriptionRepoPrivatePath = path.resolve(__dirname, "descriptionRepoPrivate")

  let repoExists
  try {
    await fs.access(descriptionRepoPublicPath, fs.constants.F_OK)
    repoExists = true
  } catch (error) {
    repoExists = false
  }

  if (repoExists) return

  const [output1, output2] = await Promise.all([
    new Promise(resolve => {
      exec(
        `git clone --depth 1 https://${githubPAT}:x-oauth-basic@github.com/describer-blue/` +
          `audio-description-database.git ${descriptionRepoPublicPath}`,
        resolve
      )
    }),
    new Promise(resolve => {
      exec(
        `git clone --depth 1 https://${githubPAT}:x-oauth-basic@github.com/describer-blue/` +
          `audio-description-database-private.git ${descriptionRepoPrivatePath}`,
        resolve
      )
    }),
  ])

  try {
    await fs.access(descriptionRepoPrivatePath, fs.constants.F_OK)
  } catch (error) {
    console.error(output1)
    console.error(output2)
    throw error
  }
}

// TODO once bucket is available
const getPrivateRepoLock = callback => {
  callback()
}

const getDescriptionDirectory = ({ videoId, username }) => {
  let path = "/descriptions/youtube/"

  const iterations = Math.ceil(videoId.length / 2)

  for (let i = 0; i < iterations; i += 1) {
    const firstChar = videoId[i]
    const secondChar = videoId[i + 1] ?? ""
    const segment = `${firstChar}${secondChar}/`.replace(/([A-Z])/g, "^$1").toLowerCase()
    path += segment
  }

  path += `${username}/`

  return path
}

module.exports = { save }
