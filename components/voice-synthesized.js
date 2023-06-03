export default class Voice {
  onFirstInteraction() {
    return new Promise(resolve => {
      // Thanks AblePlayer!
      // https://github.com/ableplayer/ableplayer/blob/main/scripts/description.js
      var greeting = new SpeechSynthesisUtterance("Hi!")
      greeting.volume = 0 // silent
      greeting.rate = 10 // fastest speed supported by the API
      // Wow, thanks to this answer: https://stackoverflow.com/a/58775876/3888572
      speechSynthesis.cancel()
      speechSynthesis.speak(greeting)

      greeting.onend = () => {
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
      ]

      let defaultVoice
      let defaultRate = 1.2

      let bestVoiceRank

      const englishVoices = speechSynthesis.getVoices().filter(voice => voice.lang === "en-US")

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

    return new Promise(resolve => {
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

  async say(description) {
    const { voiceName, voiceRate } = this
    const voice = speechSynthesis.getVoices().find(each => each.name === voiceName)
    const utterance = new SpeechSynthesisUtterance(description.text)

    // On iOS the best voice is the default voice, which is not listed in the voice list
    const isIOS = /iPhone|iPod|iPad/.test(navigator.platform)
    if (!isIOS) {
      utterance.voice = voice
      utterance.rate = voiceRate
    } else {
      utterance.rate = 1.1
    }
    utterance.lang = "en-US"
    return new Promise(resolve => {
      utterance.addEventListener("end", resolve)
      speechSynthesis.speak(utterance)
    })
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
