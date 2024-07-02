const getAudio = ({
  ffmpeg,
  fetchFile,
  getMostRecentDurationSeconds,
  getDescriptions,
  onDescriptionsChange,
}) => {
  let currentAudioData

  const handleDescriptionsChange = async () => {
    const voiceResponse = await fetch("/api/voice", {
      method: "POST",
      body: `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
          <voice name="en-US-SteffanNeural">
            <prosody rate="+40%">
                This is a test.
            </prosody>
          </voice>
        </speak>
      `,
    })

    const voiceClip = await voiceResponse.blob()

    await ffmpeg.writeFile("1.wav", await fetchFile(voiceClip))

    // console.log(await ffmpeg.listDir("/"))

    await ffmpeg.exec([
      "-i",
      "1.wav",
      "-af",
      "alimiter=level=false:level_in=15dB:limit=0dB",
      "-ar",
      "24000",
      "-ac",
      "1",
      "-acodec",
      "pcm_s16le",
      "1-boost.wav",
    ])

    console.log("mostRecentDurationSeconds", getMostRecentDurationSeconds())

    // await ffmpeg.exec([
    //   "-f",
    //   "lavfi",
    //   "-i",
    //   "anullsrc=r=24000:cl=mono",
    //   "-t",
    //   "2.5",
    //   "-acodec",
    //   "pcm_s16le",
    //   "-ar",
    //   "24000",
    //   "-ac",
    //   "1",
    //   "silence_2500ms.wav",
    // ])

    const data = await ffmpeg.readFile("1-boost.wav")

    const audio = document.querySelector("[ffmpeg-audio]")

    if (currentAudioData) {
      URL.revokeObjectURL(currentAudioData)
    }
    currentAudioData = URL.createObjectURL(new Blob([data.buffer], { type: "audio/wav" }))

    audio.src = currentAudioData
  }

  onDescriptionsChange(handleDescriptionsChange)
  handleDescriptionsChange()

  // Create silence
  // ffmpeg.exec(["-f","lavfi","-i","anullsrc=r=24000:cl=mono","-t","2.5","-acodec","pcm_s16le","-ar","24000","-ac","1","silence_2500ms.wav"]);

  // Increase volume
  // ffmpeg.exec(["-i","2.wav","-af","alimiter=level=false:level_in=15dB:limit=0dB","-ar","24000","-ac","1","-acodec","pcm_s16le","2-boost.wav"]);

  // Combine audio
  // ffmpeg.exec(["-f","concat","-safe","0","-i","list.txt","-acodec","pcm_s16le","combo.wav"]);

  // Convert to mp3
  // ffmpeg.exec(["-i","combo.wav","-codec:a","libmp3lame","-b:a","192k","combo.mp3"]);

  const div = document.createElement("div")

  div.innerHTML = /* HTML */ `<audio ffmpeg-audio controls></audio>`

  document.body.insertAdjacentElement("afterbegin", div)
}
