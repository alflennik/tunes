const fetch = require("node-fetch")
const jsonWebToken = require("jsonwebtoken")
const fs = require("node:fs/promises")
const path = require("node:path")

const githubClientId = "Ov23liODge1a702eMeww"

const githubSecretPromise = fs
  .readFile(path.resolve(__dirname, "secretGithubApp.txt"), { encoding: "utf8" })
  .then(key => key.trim())

const jwtSecretPromise = fs
  .readFile(path.resolve(__dirname, "secretJwt.txt"), { encoding: "utf8" })
  .then(key => key.trim())

const githubPreAuthentication = (req, res) => {
  res.writeHead(302, {
    Location:
      `https://github.com/login/oauth/authorize?client_id=${githubClientId}` +
      "&redirect_uri=http://localhost:8999/api/github-post-authentication",
  })
  res.end()
}

const githubPostAuthentication = async (req, res) => {
  const githubSecret = await githubSecretPromise
  const jwtSecret = await jwtSecretPromise

  const temporaryCode = req.url.match(/\?code=(\w+)/)[1]

  const response = await fetch(
    `https://github.com/login/oauth/access_token?client_id=${githubClientId}&` +
      `client_secret=${githubSecret}&code=${temporaryCode}`,
    {
      method: "POST",
      headers: { accept: "application/json" },
    }
  )
  const { access_token: accessToken } = await response.json()

  const userResponse = await fetch("https://api.github.com/user", {
    headers: { authorization: `Bearer ${accessToken}` },
  })
  const username = (await userResponse.json()).login

  res.writeHead(302, {
    "Set-Cookie": getSetCookieHeader({ username, jwtSecret }),
    Location: "http://localhost:8999/?/signed-in-with-github",
  })
  res.end()
}

const getUser = async (req, res) => {
  const jwtSecret = await jwtSecretPromise

  let error

  const jwt = readCookie({
    cookie: req.headers.cookie,
    jwtSecret,
    onError: e => {
      error = e
    },
  })

  if (error) {
    console.error(e)
    res.statusCode = 401
    res.end(JSON.stringify(null))
  }

  if (!jwt) {
    res.statusCode = 200
    res.end(JSON.stringify(null))
    return
  }

  // Extend the session to make sure they don't get logged out
  res.writeHead(200, {
    "Set-Cookie": getSetCookieHeader({ username: jwt.username, jwtSecret }),
  })
  res.end(JSON.stringify(jwt))
}

const readCookie = ({ cookie, jwtSecret, onError }) => {
  let rawJwt = cookie?.match(/^jwt=([\w-\.]+)/)?.[1]

  let jwt
  if (rawJwt) {
    try {
      jwt = jsonWebToken.verify(rawJwt, jwtSecret)
    } catch (error) {
      if (onError) onError(error)
      return
    }
  }

  return jwt
}

const getSetCookieHeader = ({ username, jwtSecret }) => {
  const jwt = jsonWebToken.sign({ username }, jwtSecret)
  const expireDate = new Date(Date.now() + 400 * 24 * 60 * 60 * 1000).toUTCString()
  return `jwt=${jwt}; Expires=${expireDate}; SameSite=Strict; HttpOnly;`
}

module.exports = { githubPreAuthentication, githubPostAuthentication, getUser, readCookie }
