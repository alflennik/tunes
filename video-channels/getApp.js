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
      border: none;
      border-radius: 4px;
      color: white;
      padding: 4px 8px;
      cursor: pointer;
      transition: background 200ms;
      font-family: monospace;
    }
    button:hover, .button-link:hover {
      background: #444;
    }
    button:active, .button-link:active {
      background: #555;
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

  document.querySelector("#root").innerHTML = /* HTML */ `
    <style>
      .dialog-wrap {
        display: flex;
        width: 100%;
        height: 100%;
        align-items: center;
        justify-content: center;
        perspective: 1000px;
        overflow: hidden;
      }
      .dialog {
        background: #2c2c2c;
        border: 12px solid #1e1e1e;
        border-radius: 20px;
        margin: 8px;
        font-family: monospace;
        font-weight: bold;
        color: #f1f1f1;
        transform-origin: -100px -300px -150px;
      }
      .dialog.before-showing {
        opacity: 0;
        transform: rotate3d(0.3, 1, -0.2, 100deg);
      }
      .dialog.showing {
        transition: transform cubic-bezier(0, 0.47, 0, 1) 800ms, opacity 100ms;
        opacity: 1;
      }
      .dialog.before-hiding {
        transition: 400ms cubic-bezier(0.86, 0, 1, 1), opacity 300ms linear 100ms;
        opacity: 1;
      }
      .dialog.hiding {
        opacity: 0;
        transform: rotate3d(-0.8, -1, 0.1, 30deg);
      }
      .dialog-body {
        padding: 24px;
      }
      .dialog-body > p {
        margin-top: 0;
      }
      .dialog-body > p:last-of-type {
        margin-bottom: 0;
      }
      .dialog-buttons {
        border-top: 4px solid #1e1e1e;
        padding: 10px;
        display: flex;
        justify-content: right;
      }
      .dialog-buttons button {
        font-weight: bold;
        padding: 8px 50px;
        background: #2d52ce;
        border: none;
        font-family: monospace;
        transition: background 200ms;
      }
      .dialog-buttons button:hover {
        background: #1b40bf;
      }
      .dialog-buttons button:active {
        background: #1b3695;
      }
    </style>
    <div class="dialog-wrap">
      <div class="dialog">
        <div class="dialog-body">
          <p>
            Permission to play music?
            <button volume-button type="button">
              <span class="sr-only"></span>
            </button>
          </p>
          <p>Please note that users may find some content disturbing.</p>
        </div>
        <div class="dialog-buttons">
          <button okay-button type="button">Okay</button>
        </div>
      </div>
    </div>
  `

  const volumeButton = document.querySelector("[volume-button]")
  const toggleVolume = () => {
    if (volumeButton.classList.contains("on")) {
      volumeButton.classList.remove("on")
      volumeButton.setAttribute("title", "Volume Starts Off")
      volumeButton.innerHTML = /* HTML */ `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
          <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
          <path
            d="M301.1 34.8C312.6 40 320 51.4 320 64V448c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64h67.8L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3zM425 167l55 55 55-55c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-55 55 55 55c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-55-55-55 55c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l55-55-55-55c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0z"
          />
        </svg>
        <span class="sr-only">Volume Starts Muted</span>
      `
    } else {
      volumeButton.classList.add("on")
      volumeButton.setAttribute("title", "Volume Starts On")
      volumeButton.innerHTML = /* HTML */ `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
          <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
          <path
            d="M533.6 32.5C598.5 85.2 640 165.8 640 256s-41.5 170.7-106.4 223.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C557.5 398.2 592 331.2 592 256s-34.5-142.2-88.7-186.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM473.1 107c43.2 35.2 70.9 88.9 70.9 149s-27.7 113.8-70.9 149c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C475.3 341.3 496 301.1 496 256s-20.7-85.3-53.2-111.8c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zm-60.5 74.5C434.1 199.1 448 225.9 448 256s-13.9 56.9-35.4 74.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C393.1 284.4 400 271 400 256s-6.9-28.4-17.7-37.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM301.1 34.8C312.6 40 320 51.4 320 64V448c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64h67.8L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3z"
          />
        </svg>
        <span class="sr-only">Volume On</span>
      `
    }
  }
  toggleVolume()
  volumeButton.addEventListener("click", toggleVolume)

  const dialog = document.querySelector(".dialog")
  dialog.classList.add("before-showing")
  setTimeout(() => {
    dialog.classList.add("showing")
    dialog.classList.remove("before-showing")
    setTimeout(() => {
      dialog.classList.remove("showing")
    }, 2000)
  }, 1)

  const videosPromise = fetch("videos.json").then(response => response.json())

  document.querySelector("[okay-button]").addEventListener("click", async () => {
    const videoObject = await videosPromise
    const videos = Object.entries(videoObject).map(([id, durationSeconds]) => ({
      id,
      durationSeconds,
    }))

    dialog.classList.add("before-hiding")
    setTimeout(() => {
      dialog.classList.add("hiding")
    }, 1)

    await Promise.all([getAvPermissions(), new Promise(resolve => setTimeout(resolve, 1000))])

    document.querySelector("#root").innerHTML = `
      <div id="player"></div>
    `

    const channels = getChannels({ videos })

    const startsMuted = !volumeButton.classList.contains("on")

    await getPlayer({ videos, channels, startsMuted })
  })
}
