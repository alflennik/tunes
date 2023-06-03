import define from "../utilities/define.js"
import { element } from "../utilities/reconciler.js"

export default class AudioDescription extends HTMLElement {
  constructor() {
    super()
  }

  initializeState = {
    descriptions: null,
    analysis: null,
    currentDescriptionText: "",
    previousTime: null,
    isCurrentlyPlaying: false,
    lastVideoId: null,
    isReady: false,
  }

  initializeActions = ({ stateSetters }) => ({
    fetchDescriptions: async () => {
      const { video, onLoading, onReady } = this.bindings
      const { setDescriptions, setAnalysis, setIsReady } = stateSetters

      setIsReady(false)
      onLoading()

      const descriptionModule = await import(video.descriptionPath)
      const { descriptions, analysis } = descriptionModule.default
      setDescriptions(descriptions)
      setAnalysis(analysis)

      setIsReady(true)
      onReady()
    },

    handleConnect: async () => {
      const { fetchDescriptions } = this.actions
      const { video } = this.bindings
      const { setLastVideoId } = stateSetters

      setLastVideoId(video.id)
      await fetchDescriptions()
    },

    handleTimeChange: () => {
      const { time, voice } = this.bindings
      const { descriptions, currentDescriptionText, previousTime, isReady } = this.state
      const { setPreviousTime, setCurrentDescriptionText } = stateSetters

      setPreviousTime(time)

      if (!descriptions || !isReady) return

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
          voice.say(description)
        }
      }
    },

    handlePlayChange: async isPlaying => {
      const { voice, isEnded, onEnd } = this.bindings
      const { analysis } = this.state
      const { setIsCurrentlyPlaying, setCurrentDescriptionText } = stateSetters

      setIsCurrentlyPlaying(isPlaying)
      if (!isPlaying && isEnded && analysis) {
        setCurrentDescriptionText(analysis.text)
        await voice.say(analysis)
        onEnd()
      } else if (!isPlaying && isEnded) {
        onEnd()
      } else if (!isPlaying) {
        voice.pause()
      }
    },

    handleVideoChange: async () => {
      const { setLastVideoId, setCurrentDescriptionText, setPreviousTime } = stateSetters
      const { video, voice } = this.bindings
      const { fetchDescriptions } = this.actions

      voice.clear()

      setLastVideoId(video.id)
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
    const { handleTimeChange, handlePlayChange, handleVideoChange } = this.actions

    const { video } = this.bindings
    const { lastVideoId } = this.state
    if (lastVideoId !== video.id) handleVideoChange()

    const { isPlaying } = this.bindings
    const { isCurrentlyPlaying } = this.state
    if (isPlaying !== isCurrentlyPlaying) handlePlayChange(isPlaying)

    const { time } = this.bindings
    const { previousTime, currentDescriptionText } = this.state
    if (time && time !== previousTime) handleTimeChange(time)

    return element("div")
      .attributes({ class: "wrapping-box" })
      .items(element("div").text(currentDescriptionText))
  }
}

define({ "audio-description": AudioDescription })
