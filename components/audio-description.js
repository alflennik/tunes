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
    lastSongId: null,
    isReady: false,
  }

  initializeActions = ({ stateSetters }) => ({
    fetchDescriptions: async () => {
      const { song /* , onReady */ } = this.bindings
      const { setDescriptions } = stateSetters

      const descriptionModule = await import(`../songs/${song.fileName}`)
      setDescriptions(descriptionModule.default.descriptions)

      // Not yet used
      // const { descriptions } = this.state
      // onReady(descriptions)
    },

    handleConnect: async () => {
      const { fetchDescriptions } = this.actions
      const { song } = this.bindings
      const { setLastSongId } = stateSetters

      setLastSongId(song.id)
      await fetchDescriptions()
    },

    handleTimeChange: () => {
      const { time, voice } = this.bindings
      const { descriptions, currentDescriptionText, previousTime } = this.state
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

      const isTimeSeek = previousTime !== null && Math.abs(time - previousTime) > 1

      if (!isTimeSeek) {
        voice.play()
      }

      if (description && description.text !== currentDescriptionText) {
        setCurrentDescriptionText(description.text)

        if (isTimeSeek) {
          voice.clear()
        } else {
          voice.say(description.text)
        }
      }
    },

    handlePlayChange: (isPlaying) => {
      const { voice } = this.bindings
      const { setIsCurrentlyPlaying } = stateSetters
      setIsCurrentlyPlaying(isPlaying)
      if (!isPlaying) {
        voice.pause()
      }
    },

    handleSongChange: async () => {
      const { setLastSongId, setCurrentDescriptionText, setPreviousTime } = stateSetters
      const { song, voice } = this.bindings
      const { fetchDescriptions } = this.actions

      voice.clear()

      setLastSongId(song.id)
      setCurrentDescriptionText("")
      setPreviousTime(null)
      await fetchDescriptions()
    },
  })

  async connectedCallback() {
    const { handleConnect } = this.actions
    await handleConnect()
  }

  reactiveTemplate() {
    const { handleTimeChange, handlePlayChange, handleSongChange } = this.actions

    const { song } = this.bindings
    const { lastSongId } = this.state
    if (lastSongId !== song.id) handleSongChange()

    const { isPlaying } = this.bindings
    const { isCurrentlyPlaying } = this.state
    if (isPlaying !== isCurrentlyPlaying) handlePlayChange(isPlaying)

    const { time } = this.bindings
    const { previousTime, currentDescriptionText } = this.state
    if (time && time !== previousTime) handleTimeChange(time)

    return element("div")
      .attributes({ class: "wrapping-box" })
      .children(element("div").children(currentDescriptionText))
  }
}

define({ AudioDescription })
