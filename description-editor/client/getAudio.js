const getAudio = ({
  ffmpeg,
  fetchFile,
  getMostRecentDurationSeconds,
  getDescriptions,
  getDefaultSsml,
  onAudioElementChange,
  onAudioStatusChange,
}) => {
  let audioElement
  let captions
  let duckingTimes

  let currentAudioData
  const audioDataById = {}

  const getSemaphore = () => {
    let isActive = false
    let queue = []

    return async callback => {
      await new Promise(resolve => {
        if (isActive === false) {
          isActive = true
          resolve()
        } else {
          queue.push(resolve)
        }
      })

      await callback()

      if (queue.length > 0) {
        const next = queue.shift()
        next()
      } else {
        isActive = false
      }
    }
  }

  let status

  const updateStatus = newStatus => {
    if (status !== newStatus) {
      status = newStatus
      onAudioStatusChange()
    }
  }

  const renderAudio = async () => {
    if (status === "rendering") return
    updateStatus("rendering")

    console.groupCollapsed("Rendering audio")

    const descriptions = getDescriptions()

    const renderAudioSemaphore = getSemaphore()

    await Promise.all(
      descriptions.map(async description => {
        const ssml = description.ssml != null ? description.ssml : getDefaultSsml(description)

        const audioData = audioDataById[description.id]

        if (audioData) {
          if (audioData.ssml === ssml) {
            return
          }

          await ffmpeg.deleteFile(audioData.fileName)

          delete audioDataById[description.id]
        }

        const voiceResponse = await fetch("/api/voice", {
          method: "POST",
          body: `
          <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
            <voice name="en-US-SteffanNeural">
              ${ssml}
            </voice>
          </speak>
        `,
        })

        const voiceClip = await voiceResponse.blob()

        const unprocessedFileName = `${description.id}-unprocessed.wav`
        const fileName = `${description.id}.wav`

        await ffmpeg.writeFile(unprocessedFileName, await fetchFile(voiceClip))

        let durationSeconds

        // Can only run one at a time because of the way I have to get the audio duration
        await renderAudioSemaphore(async () => {
          // Increase volume with limiter
          await ffmpeg.exec([
            "-i",
            unprocessedFileName,
            "-af",
            "alimiter=level=false:level_in=15dB:limit=0dB",
            "-ar",
            "24000",
            "-ac",
            "1",
            "-acodec",
            "pcm_s16le",
            fileName,
          ])

          durationSeconds = getMostRecentDurationSeconds()
        })

        await ffmpeg.deleteFile(unprocessedFileName)

        audioDataById[description.id] = { ssml, fileName, durationSeconds }
      })
    )

    const allSilentClips = []

    let currentTime = 0

    descriptions.forEach(description => {
      const duration = audioDataById[description.id].durationSeconds

      const previousDescriptionOvershot = description.time <= currentTime
      if (previousDescriptionOvershot) {
        audioDataById[description.id].correctedTime = currentTime
        delete audioDataById[description.id].preceedingSilence
        currentTime = currentTime + duration
        return
      }

      // Fix floating point by rounding to one decimal place
      const silenceNeeded = Math.round((description.time - currentTime) * 10) / 10
      audioDataById[description.id].preceedingSilence = silenceNeeded
      delete audioDataById[description.id].correctedTime
      currentTime = description.time + duration

      allSilentClips.push(silenceNeeded)
    })

    const silentClipsThatExist = []
    const silentClipsToCreate = []
    const silentClipsToDelete = []

    const allFiles = await ffmpeg.listDir("/")
    allFiles.forEach(fileReference => {
      if (!fileReference.name.startsWith("silence")) return

      const timeMs = Number(fileReference.name.match(/^silence-(\d+)/)[1])
      const time = timeMs / 1000

      if (allSilentClips.includes(time)) {
        silentClipsThatExist.push(time)
        return
      }

      silentClipsToDelete.push(time)
    })

    allSilentClips.forEach(time => {
      if (silentClipsThatExist.includes(time)) return
      silentClipsToCreate.push(time)
    })

    const formatTimeAsMs = time => {
      return Math.round(time * 1000).toString()
    }

    await Promise.all([
      Promise.all(
        silentClipsToDelete.map(time => {
          ffmpeg.deleteFile(`silence-${formatTimeAsMs(time)}.wav`)
        })
      ),
      Promise.all(
        silentClipsToCreate.map(time => {
          ffmpeg.exec([
            "-f",
            "lavfi",
            "-i",
            "anullsrc=r=24000:cl=mono",
            "-t",
            time.toString(),
            "-acodec",
            "pcm_s16le",
            "-ar",
            "24000",
            "-ac",
            "1",
            `silence-${formatTimeAsMs(time)}.wav`,
          ])
        })
      ),
    ])

    let audioClipList = ""
    descriptions.forEach(description => {
      const { preceedingSilence } = audioDataById[description.id]
      if (preceedingSilence) {
        audioClipList += `file 'silence-${formatTimeAsMs(preceedingSilence)}.wav'\n`
      }
      audioClipList += `file '${description.id}.wav'\n`
    })

    captions = []
    descriptions.forEach(description => {
      const { correctedTime, durationSeconds } = audioDataById[description.id]
      const time = correctedTime ?? description.time
      const timeEnd = time + durationSeconds

      captions.push({ text: description.text, time, timeEnd })
    })

    duckingTimes = captions.map(({ time, timeEnd }) => ({ time, timeEnd }))

    if (!audioClipList.length) {
      console.groupEnd()

      audioElement.src = "/video-channels/none.mp3"

      onAudioElementChange()

      updateStatus("done")

      return
    }

    await ffmpeg.writeFile("list.txt", audioClipList)

    await ffmpeg.exec([
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      "list.txt",
      "-acodec",
      "pcm_s16le",
      "description.wav",
    ])

    await ffmpeg.deleteFile("list.txt")

    await ffmpeg.exec([
      "-i",
      "description.wav",
      "-codec:a",
      "libmp3lame",
      "-b:a",
      "192k",
      "description.mp3",
    ])

    await ffmpeg.deleteFile("description.wav")

    const mp3Data = await ffmpeg.readFile("description.mp3")

    const previousAudioData = currentAudioData
    currentAudioData = URL.createObjectURL(new Blob([mp3Data.buffer], { type: "audio/mpeg" }))
    audioElement.src = currentAudioData

    onAudioElementChange()

    updateStatus("done")

    if (previousAudioData) {
      URL.revokeObjectURL(previousAudioData)
    }

    console.groupEnd()
  }

  // `new Audio()` would be cleaner but there was a bug where audioElement.currentTime = 123 would
  // incorrectly set the audio.currentTime to 0 (??!) Using an audio element on the page fixes this.
  const div = document.createElement("div")
  div.innerHTML = `<audio />`
  audioElement = div.querySelector("audio")
  document.body.insertAdjacentElement("afterbegin", div)

  return {
    renderAudio,
    getAudioStatus: () => status,
    getAudioElement: () => audioElement,
    getAudioCaptions: () => captions,
    getDuckingTimes: () => duckingTimes,
  }
}

export default getAudio
