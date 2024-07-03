const getFFmpeg = async () => {
  const firstScriptTag = document.getElementsByTagName("script")[0]
  const ffmpegScript = document.createElement("script")
  const utilScript = document.createElement("script")
  ffmpegScript.src = "ffmpeg/assets/ffmpeg.js"
  utilScript.src = "ffmpeg/assets/index.js"
  firstScriptTag.parentNode.insertBefore(ffmpegScript, firstScriptTag)
  firstScriptTag.parentNode.insertBefore(utilScript, firstScriptTag)

  await new Promise(resolve => {
    let loadCount = 0
    const handleLoad = () => {
      loadCount += 1
      if (loadCount > 1) resolve()
    }
    ffmpegScript.addEventListener("load", handleLoad)
    utilScript.addEventListener("load", handleLoad)
  })

  const { fetchFile } = FFmpegUtil
  const { FFmpeg } = FFmpegWASM

  const ffmpeg = new FFmpeg()

  await ffmpeg.load({
    coreURL: "/ffmpeg/assets/ffmpeg-core.js",
  })

  let mostRecentDurationSeconds
  ffmpeg.on("log", ({ message }) => {
    const mentionedDuration = message.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/)
    if (mentionedDuration) {
      mostRecentDurationSeconds =
        Number(mentionedDuration[1]) * 60 * 60 +
        Number(mentionedDuration[2]) * 60 +
        Number(mentionedDuration[3])
    }
    console.log(message)
  })

  ffmpeg.on("progress", ({ progress, time }) => {
    console.info(progress, time)
  })

  return { ffmpeg, fetchFile, getMostRecentDurationSeconds: () => mostRecentDurationSeconds }
}
