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
          Permission to play music?<br />
          <br />
          Please note that users may find some content disturbing.
        </div>
        <div class="dialog-buttons">
          <button okay-button type="button">Okay</button>
        </div>
      </div>
    </div>
  `

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

    await getPlayer({ videos, channels })
  })
}
