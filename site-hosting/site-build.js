const fs = require("fs/promises")
const path = require("path")
const { exec, spawn } = require("child_process")

const assetLocations = ["tunes.html", "songs", "components", "library", "utilities"]

const siteBuildScript = async ({ environment }) => {
  if (environment !== "staging" && environment !== "production") {
    throw new Error("Please specify environment")
  }

  const syncGitEnvironmentBranch = async () => {
    const getStatus = async () => {
      const status = await new Promise((resolve, reject) => {
        exec("git status", (error, stdout, stderr) => {
          if (error || stderr) {
            return reject(error || stderr)
          }
          resolve(stdout)
        })
      })

      const branch = status.match(/On branch ([^\n]+)\n/)[1]
      const isWorkingTreeClean = status.match(/nothing to commit, working tree clean/) !== null
      const isUpToDate = status.match(/Your branch is up to date/) !== null

      return { branch, isWorkingTreeClean, isUpToDate }
    }

    const checkBranches = async () => {
      const branches = await new Promise((resolve, reject) => {
        exec("git branch", (error, stdout, stderr) => {
          if (error || stderr) {
            return reject(error || stderr)
          }
          resolve(stdout)
        })
      })

      if (branches.match(`\\s${environment}\\n`) === null) {
        throw new Error(`Your ${environment} branch is missing. Make sure you can push to it.`)
      }
    }

    await checkBranches()

    const { branch, isWorkingTreeClean, isUpToDate } = await getStatus()

    if (branch !== "main") {
      throw new Error("You are not currently on the main branch")
    }

    if (!isWorkingTreeClean) {
      throw new Error("You have uncommitted changes")
    }

    if (!isUpToDate) {
      throw new Error("You need to push your changes")
    }

    const checkoutBranch = async (branch) => {
      await new Promise((resolve, reject) => {
        exec(`git checkout ${branch}`, (error, stdout, stderr) => {
          if (error || (stderr && !stderr.startsWith("Switched"))) {
            return reject(error || stderr)
          }
          resolve()
        })
      }).catch((error) => {
        console.error(error)
        throw new Error("Failed to checkout")
      })

      const { branch: endingBranch } = await getStatus()

      if (endingBranch !== branch) throw new Error("Failed to checkout")
    }

    await checkoutBranch(environment)

    const pushBranch = async (branch) => {
      await new Promise((resolve, reject) => {
        exec(`git push`, (error, stdout, stderr) => {
          if (error || (stderr && !stderr.startsWith("Everything up-to-date"))) {
            return reject(error || stderr)
          }
          resolve()
        })
      }).catch((error) => {
        console.error(error)
        throw new Error("Failed to push")
      })
    }

    try {
      await pushBranch(environment)
    } catch (error) {
      await checkoutBranch("main")
      throw error
    }

    await checkoutBranch("main")
  }

  await syncGitEnvironmentBranch()

  const buildFolderPath = path.resolve(__dirname, "public")

  const clearBuildFolder = async () => {
    const confirmExists = async () => {
      await fs.mkdir(buildFolderPath, { recursive: true })
    }
    await confirmExists()

    const fileNames = await fs.readdir(buildFolderPath)
    await Promise.all(
      fileNames.map(async (fileName) => {
        const filePath = path.resolve(buildFolderPath, fileName)
        console.log(filePath)
        await fs.rm(filePath, { recursive: true })
      })
    )
  }

  await clearBuildFolder()

  const copyAssets = async () => {
    await Promise.all(
      assetLocations.map(async (assetLocation) => {
        const assetSource = path.resolve(__dirname, "../", assetLocation)
        const assetDestination = path.resolve(buildFolderPath, assetLocation)
        fs.cp(assetSource, assetDestination, { recursive: true })
      })
    )
  }

  await copyAssets()

  const firebaseDeploy = async () => {
    await new Promise((resolve, reject) => {
      const firebaseDeploy = spawn("firebase", ["deploy"], { cwd: __dirname })

      firebaseDeploy.stdout.on("data", (data) => {
        console.log(data.toString())
      })

      firebaseDeploy.stderr.on("data", (data) => {
        console.error(data.toString())
      })

      firebaseDeploy.on("close", (code) => {
        if (code !== 0) return reject()
        resolve()
      })
    })
  }

  await firebaseDeploy()
}

module.exports = siteBuildScript
