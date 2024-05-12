const getApp = async () => {
  const style = document.createElement("style")
  style.innerHTML = `
    html, body {
      margin: 0;
    }
    html, body, #root, #player {
      height: 100%;
    }
    body {
      background: black;
      color: white;
      font-family: sans-serif;
    }
    button, .button-link {
      background: black;
      border: 2px solid white;
      border-radius: 4px;
      color: white;
      padding: 4px 8px;
      cursor: pointer;
    }
    button:hover, .button-link:hover {
      background: #222;
    }
    button:active, .button-link:active {
      background: #333;
    }
    button svg, .button-link svg {
      width: 14px;
      height: 14px;
      fill: white;
      position: relative;
      top: 2px;
    }
    .sr-only {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      border: 0 !important;
    }
  `
  document.body.appendChild(style)

  document.querySelector("#root").innerHTML = `
    <style>
      .dialog-wrap {
        display: flex;
        width: 100%;
        height: 100%;
        align-items: center;
        justify-content: center;
      }
      .dialog {
        border: 2px solid white;
        border-radius: 12px;
        margin: 8px;
      }
      .dialog-body {
        padding: 24px;
      }
      .dialog-buttons {
        border-top: 2px solid white;
        padding: 12px 24px;
        display: flex;
        justify-content: right;
      }
    </style>
    <div class="dialog-wrap">
      <div class="dialog">
        <div class="dialog-body">
          Permission to play music?<br>
          <br>
          Please note that users may find some content disturbing.<br>
          <a class="sr-only" href="../tunes.html">Also check out the audio description page.</a>
        </div>
        <div class="dialog-buttons">
          <button okay-button type="button">Okay</button>
        </div>
      </div>
    </div>
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
    channelUp,
    channelDown,
    onChange,
  }
}

const getPlayer = async ({ videos, channels }) => {
  let video = channels.getVideo()
  let videoIndex = channels.getVideoIndex()
  let startSeconds = channels.getStartSeconds()

  const changeListeners = []
  const onChange = changeListener => {
    changeListeners.push(changeListener)
  }

  const onYouTubeEnd = () => {
    if (videos[videoIndex + 1]) {
      videoIndex += 1
    } else {
      videoIndex = 0
    }

    video = videos[videoIndex]

    startSeconds = 0

    changeListeners.forEach(changeListener => {
      changeListener()
    })
  }

  channels.onChange(() => {
    video = channels.getVideo()
    videoIndex = channels.getVideoIndex()
    startSeconds = channels.getStartSeconds()

    changeListeners.forEach(changeListener => {
      changeListener()
    })
  })

  document.body.querySelector("#player").innerHTML = `
    <style>
      .player-container {
        height: 100%;
        box-sizing: border-box;
        border-top: 1px solid black;
        border-bottom: 1px solid black;
        border-radius: 4px;
      }
      #youtube-player {
        width: 100%;
        height: calc(100% - 40px);
      }
      .player-buttons {
        padding: 0 12px;
      }
    </style>

    <div class="player-container">
      <div id="youtube-player"></div>

      <div class="player-buttons">
        <!-- TODO: add icons -->
        <button channel-up type="button">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"/></svg>
          Channel Up
        </button>
        <button channel-down type="button">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg>
          Channel Down
        </button>
        &nbsp;|&nbsp;
        <button restart type="button" title="Restart">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M463.5 224H472c13.3 0 24-10.7 24-24V72c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1c-87.5 87.5-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8H463.5z"/></svg>
          <span class="sr-only">Restart</span>
        </button>
        <button previous type="button" title="Previous">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M493.6 445c-11.2 5.3-24.5 3.6-34.1-4.4L288 297.7V416c0 12.4-7.2 23.7-18.4 29s-24.5 3.6-34.1-4.4L64 297.7V416c0 17.7-14.3 32-32 32s-32-14.3-32-32V96C0 78.3 14.3 64 32 64s32 14.3 32 32V214.3L235.5 71.4c9.5-7.9 22.8-9.7 34.1-4.4S288 83.6 288 96V214.3L459.5 71.4c9.5-7.9 22.8-9.7 34.1-4.4S512 83.6 512 96V416c0 12.4-7.2 23.7-18.4 29z"/></svg>
          <span class="sr-only">Previous</span>
        </button>
        <button next type="button" title="Next">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M18.4 445c11.2 5.3 24.5 3.6 34.1-4.4L224 297.7V416c0 12.4 7.2 23.7 18.4 29s24.5 3.6 34.1-4.4L448 297.7V416c0 17.7 14.3 32 32 32s32-14.3 32-32V96c0-17.7-14.3-32-32-32s-32 14.3-32 32V214.3L276.5 71.4c-9.5-7.9-22.8-9.7-34.1-4.4S224 83.6 224 96V214.3L52.5 71.4c-9.5-7.9-22.8-9.7-34.1-4.4S0 83.6 0 96V416c0 12.4 7.2 23.7 18.4 29z"/></svg>
          <span class="sr-only">Next</span>
        </button>
        <a class="button-link" href="../tunes.html" title="Audio Descriptions" style="float: right;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M192 96a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm-8 384V352h16V480c0 17.7 14.3 32 32 32s32-14.3 32-32V192h56 64 16c17.7 0 32-14.3 32-32s-14.3-32-32-32H384V64H576V256H384V224H320v48c0 26.5 21.5 48 48 48H592c26.5 0 48-21.5 48-48V48c0-26.5-21.5-48-48-48H368c-26.5 0-48 21.5-48 48v80H243.1 177.1c-33.7 0-64.9 17.7-82.3 46.6l-58.3 97c-9.1 15.1-4.2 34.8 10.9 43.9s34.8 4.2 43.9-10.9L120 256.9V480c0 17.7 14.3 32 32 32s32-14.3 32-32z"/></svg>
          <span class="sr-only">Audio Descriptions</span>
        </a>
      </div>
    </div>
  `

  await getYouTubePlayer({
    player: {
      getVideo: () => video,
      getStartSeconds: () => startSeconds,
      onChange,
    },
    onEnd: onYouTubeEnd,
  })

  document.body.querySelector("[channel-up]").addEventListener("click", () => {
    channels.channelUp()
  })

  document.body.querySelector("[channel-down]").addEventListener("click", () => {
    channels.channelDown()
  })

  document.body.querySelector("[restart]").addEventListener("click", () => {
    startSeconds = 0

    changeListeners.forEach(changeListener => {
      changeListener()
    })
  })

  document.body.querySelector("[previous]").addEventListener("click", () => {
    if (videos[videoIndex - 1]) {
      videoIndex -= 1
    } else {
      videoindex = videos.length - 1
    }

    video = videos[videoIndex]

    startSeconds = 0

    changeListeners.forEach(changeListener => {
      changeListener()
    })
  })

  document.body.querySelector("[next]").addEventListener("click", () => {
    if (videos[videoIndex + 1]) {
      videoIndex += 1
    } else {
      videoindex = 0
    }

    video = videos[videoIndex]

    startSeconds = 0

    changeListeners.forEach(changeListener => {
      changeListener()
    })
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
const getYouTubePlayer = async ({ player, onEnd }) => {
  const youtubePlayer = await new Promise(async resolve => {
    window.onYouTubeIframeAPIReady = () => {
      const youtubePlayer = new YT.Player("youtube-player", {
        height: "315",
        width: "560",
        videoId: player.getVideo().id,
        playerVars: {
          autoplay: 1,
          start: player.getStartSeconds(),
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

  player.onChange(() => {
    youtubePlayer.loadVideoById({
      videoId: player.getVideo().id,
      startSeconds: player.getStartSeconds(),
    })
  })

  youtubePlayer.addEventListener("onStateChange", ({ data }) => {
    if (data === YT.PlayerState.ENDED) onEnd()
  })
}
