define({ voiceSynthesized })({
  share: { say, clear, pause, play, getPermissions },
  track: { permissionGranted, sayCount, voiceName, voiceRate },

  update: ({ _ }) => {
    set(getPermissions).once(
      () => () =>
        _.stop(async () => {
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

            let voiceName
            let voiceRate

            const englishVoices = speechSynthesis
              .getVoices()
              .filter(voice => voice.lang === "en-US")

            for (const voice of englishVoices) {
              for (let i = 0; i < bestVoicesAndRates.length; i += 1) {
                const [bestVoiceName, rate] = bestVoicesAndRates[i]
                if (
                  voice.name === bestVoiceName &&
                  (bestVoiceRank === undefined || i < bestVoiceRank)
                ) {
                  bestVoiceRank = i
                  voiceName = voice.name
                  voiceRate = rate
                }
                if (voice.default) {
                  defaultVoice = voice
                }
              }
            }

            if (bestVoiceRank === undefined) {
              voiceName = defaultVoice.name
              voiceRate = defaultRate
            }

            return { voiceName, voiceRate }
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

          const { voiceName, voiceRate } = await new Promise(resolve => {
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

          _.set(_.voiceName)(voiceName)
          _.set(_.voiceRate)(voiceRate)
          _.set(_.permissionGranted)(true)
        })
    )

    if (!last) {
      set(permissionGranted)(false)
      set(sayCount)(0)
    }

    set(say).once(() => async description => {
      if (!_.$permissionGranted) throw new Error("Voice permissions were not granted")

      const voice = speechSynthesis.getVoices().find(each => each.name === _.$voiceName)
      const utterance = new SpeechSynthesisUtterance(description.text)

      // On iOS the best voice is the default voice, which is not listed in the voice list
      const isIOS = /iPhone|iPod|iPad/.test(navigator.platform)
      if (!isIOS) {
        utterance.voice = voice
        utterance.rate = _.$voiceRate
      } else {
        utterance.rate = 1.1
      }
      utterance.lang = "en-US"
      return new Promise(resolve => {
        utterance.addEventListener("end", () => {
          set(sayCount)($sayCount - 1)
          resolve()
        })
        set(sayCount)($sayCount + 1)
        speechSynthesis.speak(utterance)
      })
    })

    set(clear).once(() => () => {
      set(sayCount)(0)
      speechSynthesis.cancel()
    })

    set(pause).once(() => () => {
      speechSynthesis.pause()
    })

    set(play).once(() => () => {
      speechSynthesis.resume()
    })

    set(playMode).by(() => {
      if ($sayCount === 0) return "ended"
      return speechSynthesis.paused ? "paused" : "playing"
    })
  },
})
