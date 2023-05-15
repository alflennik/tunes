export default class Voice {
  onFirstInteraction() {
    return new Promise((resolve) => {
      console.log("starting synth")
      // Thanks AblePlayer!
      // https://github.com/ableplayer/ableplayer/blob/main/scripts/description.js
      var greeting = new SpeechSynthesisUtterance("Hi!")
      greeting.volume = 0 // silent
      greeting.rate = 10 // fastest speed supported by the API
      speechSynthesis.speak(greeting)
      greeting.onend = () => {
        console.log("started synth")
        // should now be able to get browser voices
        // in browsers that require a click
        resolve(this.#getBestVoice())
      }
    })
  }

  #getBestVoice() {
    const setBestVoice = () => {
      const isChrome = navigator.userAgent.indexOf("Chrome") != -1
      const isSafari =
        navigator.vendor &&
        navigator.vendor.indexOf("Apple") > -1 &&
        navigator.userAgent &&
        navigator.userAgent.indexOf("CriOS") == -1 &&
        navigator.userAgent.indexOf("FxiOS") == -1

      const bestVoicesAndRates = [
        // macOS
        ["Google US English", 1.1],
        // ["Eddy (English (US))", 1.3],
        // ["Evan (Enhanced)", 1], // Must be explicitly downloaded
        // ["Alex", 1], // Must be explicitly downloaded
        ["Samantha", isSafari ? 1.1 : 0.95],

        // Windows
        ["Microsoft Steffan Online (Natural) - English (United States)", 1.7], // Edge only
        ["Microsoft Mark - English (United States)", isChrome ? 2.8 : 1.7], // Chrome and Firefox

        ["Fred", 1.15], // iOS
      ]

      let defaultVoice
      let defaultRate = 1.2

      let bestVoiceRank

      const englishVoices = speechSynthesis.getVoices().filter((voice) => voice.lang === "en-US")

      for (const voice of englishVoices) {
        for (let i = 0; i < bestVoicesAndRates.length; i += 1) {
          const [bestVoiceName, rate] = bestVoicesAndRates[i]
          if (voice.name === bestVoiceName && (bestVoiceRank === undefined || i < bestVoiceRank)) {
            bestVoiceRank = i
            this.voiceName = voice.name
            this.voiceRate = rate
          }
          if (voice.default) {
            defaultVoice = voice
          }
        }
      }

      if (bestVoiceRank === undefined) {
        this.voiceName = defaultVoice.name
        this.voiceRate = defaultRate
      }
    }

    return new Promise((resolve) => {
      if (speechSynthesis.getVoices().length) {
        setBestVoice()
        resolve()
        return
      }
      speechSynthesis.onvoiceschanged = () => {
        speechSynthesis.onvoiceschanged = undefined
        setBestVoice()
        resolve()
      }
    })
  }

  say(description) {
    const { voiceName, voiceRate } = this
    const voice = speechSynthesis.getVoices().find((each) => each.name === voiceName)
    const utterance = new SpeechSynthesisUtterance(description.text)
    utterance.voice = voice
    utterance.rate = voiceRate
    utterance.lang = "en-US"
    speechSynthesis.speak(utterance)
  }

  clear() {
    speechSynthesis.cancel()
  }

  pause() {
    speechSynthesis.pause()
  }

  play() {
    speechSynthesis.resume()
  }
}
