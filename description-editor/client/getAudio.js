const getAudio = ({
  ffmpeg,
  fetchFile,
  getMostRecentDurationSeconds,
  getDescriptions,
  getDefaultSsml,
  onAudioElementChange,
}) => {
  let audioElement
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

  const renderAudio = async () => {
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
        currentTime = currentTime + duration
        delete audioDataById[description.id].preceedingSilence
        return
      }

      // Fix floating point by rounding to one decimal place
      const silenceNeeded = Math.round((description.time - currentTime) * 10) / 10
      currentTime = description.time + duration
      audioDataById[description.id].preceedingSilence = silenceNeeded
      allSilentClips.push(silenceNeeded)
    })

    const silentClipsThatExist = []
    const silentClipsToCreate = []
    const silentClipsToDelete = []

    const allFiles = await ffmpeg.listDir("/")
    allFiles.forEach(fileReference => {
      if (!fileReference.name.startsWith("silence")) return

      const time = Number(fileReference.name.match(/^silence-(\d+\.\d)+/)[1])

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

    await Promise.all([
      Promise.all(
        silentClipsToDelete.map(time => {
          ffmpeg.deleteFile(`silence-${time}`)
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
            `silence-${time}.wav`,
          ])
        })
      ),
    ])

    let audioClipList = ""
    descriptions.forEach(description => {
      const { preceedingSilence } = audioDataById[description.id]
      if (preceedingSilence) {
        audioClipList += `file 'silence-${preceedingSilence}.wav'\n`
      }
      audioClipList += `file '${description.id}.wav'\n`
    })

    if (!audioClipList.length) return

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

    const data = await ffmpeg.readFile("description.mp3")

    const newAudioElement = new Audio()

    const previousAudioData = currentAudioData

    currentAudioData = URL.createObjectURL(new Blob([data.buffer], { type: "audio/mpeg" }))

    newAudioElement.src = currentAudioData

    audioElement = newAudioElement

    await new Promise(resolve => {
      console.log("loaded")
      audioElement.addEventListener("loadedmetadata", resolve)
    })

    onAudioElementChange()

    if (previousAudioData) {
      URL.revokeObjectURL(previousAudioData)
    }
  }

  return { renderAudio, getAudioElement: () => audioElement }
}
