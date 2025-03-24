const getChannelPlayer = async ({ node, videos, channels, startsMuted }) => {
  let video = channels.getVideo()
  let videoIndex = channels.getVideoIndex()
  let startSeconds = channels.getStartSeconds()

  const changeListeners = []
  const onVideoChange = changeListener => {
    changeListeners.push(changeListener)
  }

  channels.onChange(() => {
    video = channels.getVideo()
    videoIndex = channels.getVideoIndex()
    startSeconds = channels.getStartSeconds()

    changeListeners.forEach(changeListener => {
      changeListener()
    })
  })

  const onVideoEnd = () => {
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

  node.innerHTML = /* HTML */ `
    <style>
      .player-container {
        height: 100%;
        box-sizing: border-box;
        border-top: 1px solid black;
        border-bottom: 1px solid black;
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .video-player {
        width: 100%;
        height: calc(100% - 45px);
      }
      #youtube-player {
        width: 100%;
        height: 100%;
      }
      .player-buttons {
        font-family: monospace;
        background: #393939;
        padding: 5px 5px 5px 12px;
        border-radius: 6px;
        margin: 5px 0;
        display: flex;
        gap: 5px;
        align-items: center;
      }
      .channel-label {
        margin-right: 7px;
      }
      .player-buttons .divider {
        width: 4px;
        height: 100%;
        position: relative;
        margin: 0 5px;
      }
      .player-buttons .divider::before {
        position: absolute;
        content: "";
        display: block;
        top: -5px;
        background: #2e2e2e;
        bottom: -5px;
        left: 0px;
        right: 0px;
      }
      .channel-indicator {
        display: inline-block;
        font-family: monospace;
        background: #ffffff;
        color: #000000;
        padding: 4px 13px;
        font-weight: bold;
        border-radius: 4px;
      }
      .descriptions-button-container {
        float: right;
        display: flex;
      }
      .descriptions-button {
        display: flex;
        align-items: center;
        gap: 0;
        background: #242424;
        border-radius: 4px;
        padding: 3px 18px 7px 21px;
        border-radius: 4px 0 0 4px;
        transition: background 200ms;
      }
      .descriptions-button:hover {
        background: #333;
      }
      .descriptions-button svg {
        width: 18px;
        height: 18px;
        fill: white;
        transition: fill 200ms;
      }
      .descriptions-button.on {
        background: white;
      }
      .descriptions-button.on svg {
        fill: black;
      }
      .descriptions-status {
        background: #4c4c4c;
        padding: 4px 8px;
        display: flex;
        align-items: center;
        border-radius: 0 4px 4px 0;
      }
      .descriptions-status svg {
        height: 14px;
        width: 14px;
        fill: #ffffff;
      }
      .descriptions-status.available {
        background: #55f243;
      }
      .descriptions-status.available svg {
        fill: #000;
      }
    </style>

    <div class="player-container">
      <div video-player-element class="video-player"></div>
      <div class="player-buttons">
        <span class="channel-label">Channel</span>
        <span channel-indicator class="channel-indicator"></span>
        <button channel-up type="button" title="Channel Up">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
            <path
              d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"
            />
          </svg>
          <span class="sr-only">Channel Up</span>
        </button>
        <button channel-down type="button" title="Channel Down">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
            <path
              d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
            />
          </svg>
          <span class="sr-only">Channel Down</span>
        </button>
        <div class="divider"></div>
        <button restart type="button" title="Restart">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
            <path
              d="M463.5 224H472c13.3 0 24-10.7 24-24V72c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1c-87.5 87.5-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8H463.5z"
            />
          </svg>
          <span class="sr-only">Restart</span>
        </button>
        <button previous type="button" title="Previous">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
            <path
              d="M493.6 445c-11.2 5.3-24.5 3.6-34.1-4.4L288 297.7V416c0 12.4-7.2 23.7-18.4 29s-24.5 3.6-34.1-4.4L64 297.7V416c0 17.7-14.3 32-32 32s-32-14.3-32-32V96C0 78.3 14.3 64 32 64s32 14.3 32 32V214.3L235.5 71.4c9.5-7.9 22.8-9.7 34.1-4.4S288 83.6 288 96V214.3L459.5 71.4c9.5-7.9 22.8-9.7 34.1-4.4S512 83.6 512 96V416c0 12.4-7.2 23.7-18.4 29z"
            />
          </svg>
          <span class="sr-only">Previous</span>
        </button>
        <button next type="button" title="Next">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
            <path
              d="M18.4 445c11.2 5.3 24.5 3.6 34.1-4.4L224 297.7V416c0 12.4 7.2 23.7 18.4 29s24.5 3.6 34.1-4.4L448 297.7V416c0 17.7 14.3 32 32 32s32-14.3 32-32V96c0-17.7-14.3-32-32-32s-32 14.3-32 32V214.3L276.5 71.4c-9.5-7.9-22.8-9.7-34.1-4.4S224 83.6 224 96V214.3L52.5 71.4c-9.5-7.9-22.8-9.7-34.1-4.4S0 83.6 0 96V416c0 12.4 7.2 23.7 18.4 29z"
            />
          </svg>
          <span class="sr-only">Next</span>
        </button>

        <div style="display: none;" class="descriptions-button-container">
          <button class="descriptions-button" aria-described-by="descriptions-status">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
              <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
              <path
                d="M192 96a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm-8 384V352h16V480c0 17.7 14.3 32 32 32s32-14.3 32-32V192h56 64 16c17.7 0 32-14.3 32-32s-14.3-32-32-32H384V64H576V256H384V224H320v48c0 26.5 21.5 48 48 48H592c26.5 0 48-21.5 48-48V48c0-26.5-21.5-48-48-48H368c-26.5 0-48 21.5-48 48v80H243.1 177.1c-33.7 0-64.9 17.7-82.3 46.6l-58.3 97c-9.1 15.1-4.2 34.8 10.9 43.9s34.8 4.2 43.9-10.9L120 256.9V480c0 17.7 14.3 32 32 32s32-14.3 32-32z"
              ></path>
            </svg>
            <span class="sr-only"></span>
          </button>
          <div id="descriptions-status" class="descriptions-status"></div>
        </div>
      </div>
    </div>
  `

  const descriptionsButton = node.querySelector(".descriptions-button")
  const toggleDescriptionsButton = () => {
    if (descriptionsButton.classList.contains("off")) {
      descriptionsButton.classList.add("on")
      descriptionsButton.classList.remove("off")
      descriptionsButton.setAttribute("title", "Descriptions On")
      descriptionsButton.querySelector(".sr-only").innerHTML = "Descriptions On"
    } else {
      descriptionsButton.classList.remove("on")
      descriptionsButton.classList.add("off")
      descriptionsButton.setAttribute("title", "Descriptions Off")
      descriptionsButton.querySelector(".sr-only").innerHTML = "Descriptions Off"
    }
  }
  toggleDescriptionsButton()
  descriptionsButton.addEventListener("click", () => {
    toggleDescriptionsButton()
  })

  const descriptionsStatus = node.querySelector(".descriptions-status")
  const toggleDescriptionsStatus = () => {
    if (descriptionsStatus.classList.contains("unavailable")) {
      descriptionsStatus.classList.add("available")
      descriptionsStatus.classList.remove("unavailable")
      descriptionsStatus.setAttribute("title", "Available")
      descriptionsStatus.innerHTML = /* HTML */ `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
          <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
          <path
            d="M342.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L160 178.7l-57.4-57.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l80 80c12.5 12.5 32.8 12.5 45.3 0l160-160zm96 128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L160 402.7 54.6 297.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l256-256z"
          />
        </svg>
        <span class="sr-only">Available</span>
      `
    } else {
      descriptionsStatus.classList.remove("available")
      descriptionsStatus.classList.add("unavailable")
      descriptionsStatus.setAttribute("title", "Unavailable for this video")
      descriptionsStatus.innerHTML = /* HTML */ `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
          <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
          <path
            d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"
          ></path>
        </svg>
        <span class="sr-only">Unavailable for this video</span>
      `
    }
  }
  toggleDescriptionsStatus()

  const formatChannel = () => {
    if (channels.getCurrentChannel() < 9) return `0${channels.getCurrentChannel() + 1}`
    return channels.getCurrentChannel() + 1
  }
  node.querySelector("[channel-indicator]").innerHTML = formatChannel()
  channels.onChange(() => {
    node.querySelector("[channel-indicator]").innerHTML = formatChannel()
  })

  node.querySelector("[channel-up]").addEventListener("click", () => {
    channels.channelUp()
  })

  node.querySelector("[channel-down]").addEventListener("click", () => {
    channels.channelDown()
  })

  node.querySelector("[restart]").addEventListener("click", () => {
    startSeconds = 0

    changeListeners.forEach(changeListener => {
      changeListener()
    })
  })

  node.querySelector("[previous]").addEventListener("click", () => {
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

  node.querySelector("[next]").addEventListener("click", () => {
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

  await getVideoPlayer({
    parentElement: node.querySelector("[video-player-element]"),
    startsMuted,
    getVideo: () => video,
    getStartSeconds: () => startSeconds,

    // Eventually descriptions will come through here
    getAudioElement: () => null,
    getDuckingTimes: () => null,
    getCaptions: () => null,

    onVideoChange,
    onEnd: onVideoEnd,
  })
}
