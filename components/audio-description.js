import define from "../utilities/define.js"
import { element } from "../utilities/fun-html.js"

export default class AudioDescription extends HTMLElement {
  constructor() {
    super()
  }

  initializeState = {
    descriptions: null,
    currentDescriptionText: "",
    previousTime: null,
    isCurrentlyPlaying: false,
    voiceName: null,
    voiceRate: null,
    lastSongId: null,
    isReady: false,
  }

  initializeActions = ({ stateSetters }) => ({
    // tryInitializeSpeechApi: () => {

    // },

    // useClickHackToInitializeSpeechApi: () => {

    // },

    getBestVoice: () => {
      const setBestVoice = () => {
        const { setVoiceName, setVoiceRate } = stateSetters

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
          ["Samantha", isSafari ? 1.15 : 0.95],

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
            if (
              voice.name === bestVoiceName &&
              (bestVoiceRank === undefined || i < bestVoiceRank)
            ) {
              bestVoiceRank = i
              setVoiceName(voice.name)
              setVoiceRate(rate)
            }
            if (voice.default) {
              defaultVoice = voice
            }
          }
        }

        if (bestVoiceRank === undefined) {
          setVoiceName(defaultVoice.name)
          setVoiceRate(defaultRate)
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
    },

    fetchDescriptions: async () => {
      const { song /* , onReady */ } = this.bindings
      const { setDescriptions } = stateSetters

      const descriptionModule = await import(`../songs/${song.fileName}`)
      setDescriptions(descriptionModule.default.descriptions)

      // Not yet used
      // const { descriptions } = this.state
      // onReady(descriptions)
    },

    handleTimeChange: () => {
      const { time } = this.bindings
      const { previousTime, descriptions, currentDescriptionText } = this.state
      const { say } = this.utilities
      const { setPreviousTime, setCurrentDescriptionText } = stateSetters

      const isTimeSeek = Math.abs(time - previousTime) > 1
      console.log("isTimeSeek?", isTimeSeek, Math.abs(time - previousTime))

      setPreviousTime(time)

      if (!descriptions) return

      let description
      for (let i = descriptions.length - 1; i >= 0; i -= 1) {
        if (time > descriptions[i].time) {
          description = descriptions[i]
          break
        }
      }

      if (description && description.text !== currentDescriptionText) {
        setCurrentDescriptionText(description.text)
        if (!isTimeSeek) {
          say(description.text)
        }
      }
    },

    handlePlayChange: (isPlaying) => {
      const { setIsCurrentlyPlaying } = stateSetters
      setIsCurrentlyPlaying(isPlaying)
      if (isPlaying) {
        speechSynthesis.resume()
      } else {
        speechSynthesis.pause()
      }
    },

    trackLastSongId: () => {
      const { setLastSongId } = stateSetters
      const { song } = this.bindings
      setLastSongId(song.id)
    },
  })

  utilities = {
    say: (text) => {
      const { voiceName, voiceRate } = this.state
      const voice = speechSynthesis.getVoices().find((each) => each.name === voiceName)
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.voice = voice
      utterance.rate = voiceRate
      utterance.lang = "en-US"
      speechSynthesis.speak(utterance)
    },
  }

  async connectedCallback() {
    const enableApiOnFirstInteraction = () => {
      // Thanks AblePlayer!
      // https://github.com/ableplayer/ableplayer/blob/main/scripts/description.js
      var greeting = new SpeechSynthesisUtterance("Hi!")
      greeting.volume = 0 // silent
      greeting.rate = 10 // fastest speed supported by the API
      speechSynthesis.speak(greeting)
      greeting.onstart = function (e) {
        document.removeEventListener("click", enableApiOnFirstInteraction)
      }
      greeting.onend = function (e) {
        // should now be able to get browser voices
        // in browsers that require a click
        getBestVoice()
      }
    }
    document.addEventListener("click", enableApiOnFirstInteraction)
    const { fetchDescriptions, getBestVoice } = this.actions
    await Promise.all([getBestVoice(), fetchDescriptions()])
  }

  reactiveTemplate() {
    const { song, time, isPlaying } = this.bindings
    const { isCurrentlyPlaying, previousTime, currentDescriptionText, lastSongId } = this.state
    const { fetchDescriptions, handleTimeChange, handlePlayChange, trackLastSongId } = this.actions

    if (time && time != previousTime) handleTimeChange(time)

    if (isPlaying != isCurrentlyPlaying) handlePlayChange(isPlaying)

    if (song.id !== lastSongId) {
      fetchDescriptions().then(() => {
        trackLastSongId(song.id)
      })
    }

    return element("div").setAttributes({ class: "wrapping-box" })(
      element("div")(currentDescriptionText)
    )
  }
}

define({ AudioDescription })
