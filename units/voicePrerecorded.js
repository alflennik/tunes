import { define, once } from "../utilities/multigraph.js"

define("voicePrerecorded", {
  share: { say, clear, pause, play, playMode, getPermissions },
  track: { audioElements, activeElement, activePromise },

  update: function ({ change }) {
    getPermissions = once($getPermissions, () => {
      return new Promise(resolve => {
        const audioElement = new Audio("../../audio/none.mp3")
        audioElement.addEventListener("ended", () => {
          resolve()
        })
        audioElement.play()
        change(() => {
          this.playMode = "unstarted"
        })
      })
    })

    say = once($say, async spokenItem => {
      const audioElement = new Audio(spokenItem.filePath)

      if (this.activePromise && !this.activeElement.paused) {
        await this.activePromise
      }

      await change(() => {
        this.activeElement = audioElement
        this.activePromise = new Promise(resolve => {
          const endListener = async () => {
            this.activeElement.removeEventListener("ended", endListener)
            await change(() => {
              this.activeElement = null
              this.activePromise = null
              this.playMode = "ended"
            })
            resolve()
          }
          this.activeElement.addEventListener("ended", endListener)
        })
        this.playMode = "playing"
      })

      this.activeElement.play()

      return this.activePromise
    })

    clear = once($clear, () => {
      if (!this.activeElement) return
      this.activeElement.pause()
      return change(() => {
        this.activeElement = null
        this.activePromise = null
        this.playMode = "unstarted"
      })
    })

    pause = once($pause, () => {
      if (!this.activeElement) return
      this.activeElement.pause()
      return change(() => {
        this.playMode = "paused"
      })
    })

    play = once($play, () => {
      if (!this.activeElement) return
      this.activeElement.play()
      return change(() => {
        this.playMode = "playing"
      })
    })
  },
})
