const getApp = async () => {
  document.querySelector("#root").innerHTML = `
    <div>Permission to play music?</div>
    <button okay-button type="button">Okay</button>
  `

  const videosPromise = fetch("videos.json").then(response => response.json())

  document.querySelector("[okay-button]").addEventListener("click", async () => {
    const videoObject = await videosPromise
    const videos = Object.entries(videoObject).map(([id, durationSeconds]) => ({
      id,
      durationSeconds,
    }))

    await getAvPermissions()

    document.querySelector("#root").innerHTML = `
      <div id="player"></div>
    `

    const channels = getChannels({ videos })

    await getPlayer({ videos, channels })
  })
}

getApp()

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

        const followingSeconds = secondsList[middleIndex + 1]

        if (middleSeconds < seconds && (!followingSeconds || followingSeconds > seconds)) {
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

  const callbacks = []

  const onChange = callback => {
    callbacks.push(callback)
  }

  channelSeconds = []

  const getUnixEpochSeconds = () => {
    return Math.round(Number(new Date()) / 1000)
  }

  let video
  let videoIndex
  let startSeconds

  const updateVideo = () => {
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

    callbacks.forEach(callback => {
      callback({ video, videoIndex, startSeconds })
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
    video,
    getVideoIndex: () => videoIndex,
    getStartSeconds: () => startSeconds,
    channelUp,
    channelDown,
    onChange,
  }
}

const getPlayer = async ({ videos, channels }) => {
  const changeListeners = []
  const listenForChanges = changeListener => {
    changeListeners.push(changeListener)
  }

  const onYouTubeEnd = () => {
    let videoIndex = channels.getVideoIndex()

    if (videos[videoIndex + 1]) {
      videoIndex += 1
    } else {
      videoIndex = 0
    }

    changeListeners.forEach(changeListener => {
      changeListener({ video: videos[videoIndex], startSeconds: 0 })
    })
  }

  channels.onChange(({ video, startSeconds }) => {
    changeListeners.forEach(changeListener => {
      changeListener({ video, startSeconds })
    })
  })

  document.body.querySelector("#player").innerHTML = `
    <style>
      .player-container {
        border-top: 1px solid black;
        border-bottom: 1px solid black;
        border-radius: 4px;
      }
    </style>

    <div class="player-container">
      <div id="youtube-player"></div>

      <div class="player-buttons">
        <!-- TODO: add icons -->
        <button channel-up type="button">Channel Up</button>
        <button channel-down type="button">Channel Down</button>
      </div>
    </div>
  `

  await getYouTubePlayer({
    video: videos[channels.getVideoIndex()],
    startSeconds: channels.getStartSeconds(),
    listenForChanges,
    onEnd: onYouTubeEnd,
  })

  document.body.querySelector("[channel-up]").addEventListener("click", () => {
    channels.channelUp()
  })

  document.body.querySelector("[channel-down]").addEventListener("click", () => {
    channels.channelDown()
  })
}

const getAvPermissions = () => {
  return new Promise(resolve => {
    const audioElement = new Audio("none.mp3")
    audioElement.addEventListener("ended", () => {
      resolve()
    })
    audioElement.play()
  })
}

/**
 * <div id="youtube-player"></div> must be on the page.
 */
const getYouTubePlayer = async ({ video, startSeconds, listenForChanges, onEnd }) => {
  const youtubePlayer = await new Promise(async resolve => {
    window.onYouTubeIframeAPIReady = () => {
      const youtubePlayer = new YT.Player("youtube-player", {
        height: "315",
        width: "560",
        videoId: video.id,
        playerVars: {
          autoplay: 1,
          start: startSeconds,
          iv_load_policy: 3, // Do not show annotations
          playsinline: 1, // Instead of immediately going full screen.
          color: "white", // Instead of youtube red.
          rel: 0, // Recommend videos from the same channel after it ends.
        },
      })

      youtubePlayer.addEventListener("onReady", () => {
        resolve(youtubePlayer)
      })
    }

    const scriptElement = document.createElement("script")
    scriptElement.src = "https://www.youtube.com/iframe_api"
    const firstScriptTag = document.getElementsByTagName("script")[0]
    firstScriptTag.parentNode.insertBefore(scriptElement, firstScriptTag)
  })

  listenForChanges(({ video, startSeconds }) => {
    youtubePlayer.loadVideoById({ videoId: video.id, startSeconds })
  })

  youtubePlayer.addEventListener("onStateChange", ({ data }) => {
    if (data === YT.PlayerState.ENDED) onEnd()
  })
}
