import { define, doOnce, once } from "../utilities/multigraph.js"

define("voiceSynthesized", {
  receive: { isIOS, isAndroid },
  share: { say, clear, pause, play, playMode, getPermissions },
  track: { permissionGranted, voiceName, voiceRate, activeUtterances, androidNeedsRestart },

  update: function ({ stop, change }) {
    // A reference needs to be kept for active utterances, or they might be garbage collected!
    // See https://stackoverflow.com/a/35935851/3888572
    // See https://bugs.chromium.org/p/chromium/issues/detail?id=509488
    doOnce($this.$activeUtterances, () => {
      activeUtterances = new Set()
    })

    getPermissions = once($getPermissions, () => {
      return stop(async () => {
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
            ["Samantha", isChrome ? 1.2 : isSafari ? 1.1 : 1],

            // Windows
            ["Microsoft Steffan Online (Natural) - English (United States)", 1.7], // Edge only
            ["Microsoft Mark - English (United States)", isChrome ? 2.8 : 1.7], // Chrome and Firefox

            // Android
            ["English United States", 1.7],
          ]

          let defaultVoice
          let defaultRate = 1.2

          let bestVoiceRank

          let foundVoiceName
          let foundVoiceRate

          const englishVoices = speechSynthesis
            .getVoices()
            .filter(voice => voice.lang === "en-US" || voice.lang === "en_US")

          for (const voice of englishVoices) {
            for (let i = 0; i < bestVoicesAndRates.length; i += 1) {
              const [bestVoiceName, rate] = bestVoicesAndRates[i]
              if (
                voice.name === bestVoiceName &&
                (bestVoiceRank === undefined || i < bestVoiceRank)
              ) {
                bestVoiceRank = i
                foundVoiceName = voice.name
                foundVoiceRate = rate
              }
              if (voice.default) {
                defaultVoice = voice
              }
            }
          }

          if (bestVoiceRank === undefined) {
            foundVoiceName = defaultVoice.name
            foundVoiceRate = defaultRate
          }

          return { foundVoiceName, foundVoiceRate }
        }

        const getBestVoice = () => {
          return new Promise(resolve => {
            if (speechSynthesis.getVoices().length) {
              resolve(setBestVoice())
              return
            }
            speechSynthesis.onvoiceschanged = () => {
              speechSynthesis.onvoiceschanged = undefined
              resolve(setBestVoice())
            }
          })
        }

        const { foundVoiceName, foundVoiceRate } = await new Promise(resolve => {
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
            resolve(getBestVoice())
          }
        })

        this.voiceName = foundVoiceName
        this.voiceRate = foundVoiceRate
        this.permissionGranted = true
      })
    })

    doOnce($permissionGranted, () => {
      permissionGranted = false
    })

    say = once($say, async description => {
      if (!this.permissionGranted) throw new Error("Voice permissions were not granted")

      const voice = speechSynthesis.getVoices().find(each => each.name === this.voiceName)
      const utterance = new SpeechSynthesisUtterance(description.text)

      // On older versions of iOS (v16) the best voice is the default voice, which is not listed in
      // the voice list
      if (!this.isIOS) {
        utterance.voice = voice
        utterance.rate = this.voiceRate
      } else {
        utterance.rate = 1.1
      }
      utterance.lang = "en-US"
      return new Promise(async resolve => {
        utterance.addEventListener("end", async () => {
          change(() => {
            this.activeUtterances.delete(utterance)
          })
          resolve()
        })
        change(() => {
          this.activeUtterances.add(utterance)
        })
        speechSynthesis.speak(utterance)
        speechSynthesis.resume() // Required by desktop Chrome
      })
    })

    clear = once($clear, () => {
      change(() => {
        this.activeUtterances.clear()
      })
      speechSynthesis.cancel()
    })

    pause = once($pause, () => {
      // In Android pause is the same as clear and must be handled as such
      if (this.isAndroid) return this.clear()
      speechSynthesis.pause()
    })

    play = once($play, () => {
      speechSynthesis.resume()
    })

    playMode = (() => {
      if (activeUtterances.size === 0) return "ended"
      return speechSynthesis.paused ? "paused" : "playing"
    })()
  },
})
