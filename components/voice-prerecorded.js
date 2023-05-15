export default class VoicePrerecorded {
  #activeElement
  #activePromise
  #audioFilePaths
  #audioElements

  preloadAudioFilePaths(audioFilePaths) {
    this.#audioFilePaths = audioFilePaths
  }

  async onFirstInteraction() {
    if (!this.#audioFilePaths) return
    this.#audioElements = this.#audioFilePaths.map((audioFilePath) => new Audio(audioFilePath))
    console.log("audio preloaded")

    console.log("setting interval")
    setInterval(() => {
      console.log("try to duck")
      var duckTriggerText = new SpeechSynthesisUtterance("the fox jumped over the lazy dog")
      duckTriggerText.volume = 0
      duckTriggerText.rate = 1
      speechSynthesis.speak(duckTriggerText)
    }, 4000)
  }

  async say(description) {
    const audioElement = this.#audioElements.find(
      (audioElement) => audioElement.getAttribute("src") === description.prerecorded.filePath
    )

    if (this.#activePromise && !this.#activeElement.paused) {
      await this.#activePromise
    }
    this.#activeElement = audioElement
    this.#activePromise = new Promise((resolve) => {
      this.#activeElement.addEventListener("ended", () => {
        this.#activeElement = null
        this.#activePromise = null
        resolve()
      })
    })
    this.#activeElement.play()
    return this.#activePromise
  }

  clear() {
    if (!this.#activeElement) return
    this.#activeElement.pause()
    this.#activeElement = null
    this.#activePromise = null
  }

  pause() {
    if (!this.#activeElement) return
    this.#activeElement.pause()
  }

  play() {
    if (!this.#activeElement) return
    this.#activeElement.play()
  }
}
