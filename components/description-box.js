import define from "../utilities/define.js"
import { element } from "../utilities/fun-html.js"

export default class DescriptionBox extends HTMLElement {
  constructor() {
    super()
  }

  initializeState = {
    descriptions: null,
    currentDescriptionText: "",
    previousTime: null,
    voiceName: null,
    voiceRate: null,
  }

  initializeActions = ({ stateSetters }) => ({
    getBestVoice: () => {
      const setBestVoice = () => {
        const { setVoiceName, setVoiceRate } = stateSetters

        const isChrome = navigator.userAgent.indexOf("Chrome") != -1

        const bestVoicesAndRates = [
          // macOS
          ["Google US English", 1.1],
          // ["Eddy (English (US))", 1.2],
          // ["Evan (Enhanced)", 1], // Must be explicitly downloaded
          // ["Alex", 1], // Must be explicitly downloaded
          ["Samantha", 0.95],

          // Windows
          ["Microsoft Steffan Online (Natural) - English (United States)", 1.8], // Edge only
          ["Microsoft Mark - English (United States)", isChrome ? 2.9 : 1.8], // Chrome and Firefox
        ]

        let defaultVoice
        let defaultRate = 1.2

        let bestVoiceRank

        for (const voice of speechSynthesis.getVoices()) {
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
      const { song, onReady } = this.bindings
      const { setDescriptions } = stateSetters

      const descriptionModule = await import(`../songs/${song.fileName}`)
      setDescriptions(descriptionModule.default.descriptions)

      const { descriptions } = this.state

      onReady(descriptions)
    },

    handleTimeChange: () => {
      const { time } = this.bindings
      const { descriptions, currentDescriptionText } = this.state
      const { say } = this.utilities
      const { setPreviousTime, setCurrentDescriptionText } = stateSetters

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
        say(description.text)
      }
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
    const { fetchDescriptions, getBestVoice } = this.actions
    await Promise.all([getBestVoice(), fetchDescriptions()])
  }

  reactiveTemplate() {
    const { time } = this.bindings
    const { previousTime, currentDescriptionText } = this.state
    const { handleTimeChange } = this.actions

    if (time && time != previousTime) handleTimeChange(time)

    return element("div").setAttributes({ class: "wrapping-box" })(
      element("div")(currentDescriptionText)
    )
  }
}

define({ DescriptionBox })
