const getSignInPage = () => {
  const root = document.querySelector("#root")
  root.innerHTML = /* HTML */ `
    <style>
      body {
        background: black;
        color: white;
        font-family: monospace;
        font-size: 16px;
      }
      .redirecting {
        padding: 15px;
      }
    </style>
    <div class="redirecting">Redirecting to GitHub ...</div>
  `
  location.href = "/api/github-pre-authentication"
}

const getSignedInPage = async () => {
  const root = document.querySelector("#root")
  root.innerHTML = /* HTML */ `
    <style>
      body {
        background: black;
        color: white;
        font-family: monospace;
        font-size: 16px;
      }
      .close-tab {
        background: #454545;
        border-radius: 4px;
        margin: 30px;
        grid-template-columns: 1fr max-content;
        display: grid;
        border: 12px solid #757272;
        padding: 15px;
        gap: 15px;
        max-width: max-content;
        align-items: center;
      }
      .close-button {
        border: none;
        background: #2d52ce;
        display: flex;
        height: 30px;
        width: 30px;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }
      .close-button svg {
        fill: white;
        width: 20px;
        height: 20px;
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
    </style>
    <div container></div>
  `

  const containerElement = root.querySelector("[container]")

  const response = await fetch("/api/user")
  const user = await response.json()

  let message
  if (user && user.username) {
    message = `
             <span>
            <strong>Welcome, ${user.username}!</strong>
            You have signed in. You can close this tab and return to the app.
          </span>
    `
  } else {
    message = `An error occurred.`
  }

  containerElement.innerHTML = /* HTML */ `
    <div class="close-tab">
      <div class="close-tab-body" message></div>
      <button close-button type="button" title="Close" class="close-button">
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
          <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
          <path
            d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"
          />
        </svg>
        <div class="sr-only">Close</div>
      </button>
    </div>
  `

  const messageElement = containerElement.querySelector("[message]")
  messageElement.innerHTML = message

  containerElement.querySelector("[close-button]").addEventListener("click", () => {
    close()
  })
}
