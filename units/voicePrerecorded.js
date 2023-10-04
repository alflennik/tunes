import { define, once } from "../utilities/multigraph.js"

define("voicePrerecorded", {
  watch: { audioDescription: { descriptions } },
  share: { say, clear, pause, play, playMode, getPermissions },
  track: { audioElements, activeElement, activePromise },

  update: function ({ change }) {
    getPermissions = once($getPermissions, () => {
      const audioFilePaths = this.descriptions.map(description => description.filePath)
      const newAudioElements = []
      audioFilePaths.map(audioFilePath => {
        const audioElement = new Audio(audioFilePath)
        newAudioElements.push(audioElement)
      })

      change(() => {
        this.audioElements = newAudioElements
        this.playMode = "unstarted"
      })
    })

    say = once($say, async description => {
      console.log("say")
      const audioElement = this.audioElements.find(
        audioElement => audioElement.getAttribute("src") === description.filePath
      )
      if (this.activePromise && !this.activeElement.paused) {
        await this.activePromise
      }
      this.activeElement = audioElement
      this.activePromise = new Promise(resolve => {
        this.activeElement.addEventListener("ended", () => {
          this.activeElement = null
          this.activePromise = null
          this.playMode = "ended"
          resolve()
        })
      })
      this.activeElement.play()
      this.playMode = "playing"
      return this.activePromise
    })

    clear = once($clear, () => {
      if (!this.activeElement) return
      this.activeElement.pause()
      this.activeElement = null
      this.activePromise = null
      this.playMode = "unstarted"
    })

    pause = once($pause, () => {
      if (!this.activeElement) return
      this.activeElement.pause()
      this.playMode = "paused"
    })

    play = once($play, () => {
      if (!this.activeElement) return
      this.activeElement.play()
      this.playMode = "playing"
    })
  },
})
