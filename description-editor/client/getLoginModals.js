import getModal from "./utilities/getModal.js"
import getId from "./utilities/getId.js"
import addStyle from "./utilities/addStyle.js"

const signInWithGitHubClass = getId()

addStyle(`
  .${signInWithGitHubClass} {
    .sign-in-with-github-button {
      margin-top: 17px;
      background: #282626;
      color: white;
      border: 1px solid white;
      border-radius: 4px;
      font-family: monospace;
      padding: 15px;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .sign-in-with-github-button svg {
      fill: white;
      width: 18px;
      height: 18px;
    }
    .already-signed-in-button {
      display: block;
      background: transparent;
      border: none;
      color: #6a8cff;
      font-family: monospace;
      margin-top: 21px;
      text-decoration: underline;
      padding: 0 0 2px 0;
      font-size: 14px;
      cursor: pointer;
    }
  }
`)

const getSignInModal = ({ callback } = {}) => {
  getModal({
    title: "Please Sign In",
    getBody: parentNode => {
      parentNode.innerHTML = /* HTML */ `
        <div class="${signInWithGitHubClass}">
          Click the link below to sign in with GitHub. If you do not have a GitHub account, you can
          create one.
          <button type="button" class="sign-in-with-github-button">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512">
              <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
              <path
                d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3 .3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5 .3-6.2 2.3zm44.2-1.7c-2.9 .7-4.9 2.6-4.6 4.9 .3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3 .7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3 .3 2.9 2.3 3.9 1.6 1 3.6 .7 4.3-.7 .7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3 .7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3 .7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
              ></path>
            </svg>
            Sign In With GitHub
          </button>
          <button type="button" class="already-signed-in-button">Already signed in?</button>
        </div>
      `

      const signInWithGitHubElement = parentNode.querySelector(".sign-in-with-github-button")
      const alreadySignedInElement = parentNode.querySelector(".already-signed-in-button")

      signInWithGitHubElement.addEventListener("click", () => {
        window.open("/?/sign-in-with-github")

        getConfirmSignInModal({ callback })
      })

      alreadySignedInElement.addEventListener("click", () => {
        getConfirmSignInModal({ callback })
      })
    },

    actions: [
      {
        text: "Cancel",
        action: () => {
          if (callback) callback()
        },
      },
    ],
  })
}

const getConfirmSignInModal = ({ callback } = {}) => {
  return getModal({
    replacesExistingModals: true,
    title: "Did you sign in?",
    body: /* HTML */ `Press "continue" after you have signed in.`,
    actions: [
      {
        text: "Continue",
        isPrimary: true,
        action: async () => {
          const response = await fetch("/api/user")
          const user = await response.json()
          if (user) {
            window.user = user
            window.userListeners?.forEach(listener => listener())
            if (callback) callback()
            return
          }
          return false
        },
      },
      {
        text: "Back",
        action: () => {
          getSignInModal({ callback })
        },
      },
    ],
  })
}

const getTermsModal = () => {
  return getModal({
    title: "Terms",
    body: /* HTML */ `Your work will be published under the
      <a href="https://opensource.org/license/mit" target="_blank" rel="noreferrer"
        >MIT open source license</a
      >, allowing it to be used for any purpose without attribution. <br /><br />

      While you can delete your work at any time, please note that anyone who already downloaded
      your work might continue to use it, and there will still be copies of your work in the
      project's source code history. <br /><br />

      Do you accept these terms?`,
    actions: [
      {
        text: "I accept",
        isPrimary: true,
        action: () => {},
      },
      {
        text: "Cancel",
        action: () => {},
      },
    ],
  })
}

export { getSignInModal, getConfirmSignInModal, getTermsModal }
