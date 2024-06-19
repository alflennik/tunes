/**
 * Divide a set of videos into twenty "channels," TV style, which are all playing apparently
 * simultaneously. All channels are equally spaced apart in their "schedule" and will ultimately
 * loop over all the video content.
 */
const getChannels = ({ videos }) => {
  const { totalSeconds, getVideoIndexAtSeconds } = (() => {
    let totalSeconds = 0
    const secondsList = []

    videos.forEach(({ durationSeconds }, index) => {
      secondsList.push(totalSeconds)
      totalSeconds += durationSeconds
    })

    const getVideoIndexAtSeconds = seconds => {
      let startIndex = 0
      let endIndex = secondsList.length - 1

      let result

      while (true) {
        const middleIndex = Math.round((startIndex + endIndex) / 2)
        const middleSeconds = secondsList[middleIndex]

        const previousSeconds = secondsList[middleIndex - 1]
        const followingSeconds = secondsList[middleIndex + 1]

        const matchedOnlyVideo = previousSeconds === undefined && followingSeconds === undefined
        const matchedFirstVideo = previousSeconds < seconds && middleSeconds > seconds
        const matchedLastVideo = middleSeconds < seconds && followingSeconds === undefined
        const matchedVideo = middleSeconds < seconds && followingSeconds > seconds

        if (matchedFirstVideo) {
          result = [middleIndex - 1, previousSeconds]
          break
        }

        if (matchedOnlyVideo || matchedLastVideo || matchedVideo) {
          result = [middleIndex, middleSeconds]
          break
        }

        if (middleSeconds < seconds) {
          startIndex = middleIndex
          continue
        }

        endIndex = middleIndex
      }

      return result
    }

    return { totalSeconds, getVideoIndexAtSeconds }
  })()

  const channelCount = 20

  let currentChannel = 0

  const channelSecondsApart = totalSeconds / channelCount

  const changeListeners = []

  const onChange = changeListener => {
    changeListeners.push(changeListener)
  }

  const getUnixEpochSeconds = () => {
    return Math.round(Number(new Date()) / 1000)
  }

  let video
  let videoIndex
  let startSeconds

  const updateVideo = () => {
    const channelSeconds = []

    let seconds = getUnixEpochSeconds() % totalSeconds

    for (let i = 0; i < channelCount; i += 1) {
      channelSeconds.push(seconds)

      if (seconds + channelSecondsApart > totalSeconds) {
        seconds = seconds + channelSecondsApart - totalSeconds
      } else {
        seconds = seconds + channelSecondsApart
      }
    }

    videoIndexResult = getVideoIndexAtSeconds(channelSeconds[currentChannel])
    videoIndex = videoIndexResult[0]
    const videoOverallSeconds = videoIndexResult[1]

    startSeconds = channelSeconds[currentChannel] - videoOverallSeconds
    video = videos[videoIndex]

    changeListeners.forEach(changeListener => {
      changeListener()
    })
  }

  updateVideo()

  const channelUp = () => {
    if (currentChannel + 1 >= channelCount) {
      currentChannel = 0
    } else {
      currentChannel += 1
    }
    updateVideo()
  }

  const channelDown = () => {
    if (currentChannel - 1 < 0) {
      currentChannel = channelCount - 1
    } else {
      currentChannel -= 1
    }
    updateVideo()
  }

  return {
    getVideo: () => video,
    getVideoIndex: () => videoIndex,
    getStartSeconds: () => startSeconds,
    getCurrentChannel: () => currentChannel,
    channelUp,
    channelDown,
    onChange,
  }
}
