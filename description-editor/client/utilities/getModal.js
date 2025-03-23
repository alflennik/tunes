import addStyle from "./addStyle.js"
import createElementHTML from "./createElementHTML.js"
import getId from "./getId.js"

const modalShadeClass = getId()
const modalClass = getId()

addStyle(`
  .${modalShadeClass} {
    position: fixed;
    inset: 0;
    background: #000000a1;
  }
  .${modalClass} {
    background: #2c2c2c;
    border: 12px solid #1e1e1e;
    width: 100%;
    max-width: 500px;
    margin: 170px auto;
    border-radius: 15px;
    font-family: monospace;

    .title {
      padding: 24px 24px 18px 24px;
    }
    .title h1 {
      margin: 0;
      line-height: 1;
      font-size: 19px;
      display: inline-block;
    }
    .body {
      padding: 0 24px 24px;
      border-bottom: 4px solid #1e1e1e;
      font-size: 16px;
      line-height: 1.25;
    }
    .body a {
      color: #6a8cff;
    }
    .actions {
      padding: 10px 24px;
      display: flex;
      justify-content: end;
      gap: 10px;
    }
    .actions button {
      font-weight: bold;
      padding: 8px 50px;
      color: white;
      border: none;
      font-family: monospace;
      transition: background 200ms;
      cursor: pointer;
      border-radius: 4px;
      background: #424242;
    }
    .actions button.primary {
      background: #2d52ce;
    }
  }
`)

const getModal = ({ title, getBody, body, actions, replacesExistingModals = false }) => {
  const node = createElementHTML(`
    <div modal-instance class="${modalShadeClass}">
      <div class="${modalClass}">
        <div class="title">
          <h1>${title}</h1>
        </div>
        <div class="body"></div>
        <div class="actions"></div>
      </div>
    </div>
  `)

  const modalBody = node.querySelector(".body")
  const actionsNode = node.querySelector(".actions")

  if (body) {
    modalBody.innerHTML = body
  } else if (getBody) {
    getBody(modalBody)
  }

  actions.forEach(({ text, action, isPrimary }, index) => {
    const button = document.createElement("button")

    if (isPrimary) button.classList.add("primary")

    const isFirst = index === 0
    if (isFirst) {
      button.setAttribute("is-first", "")
    }

    const isLast = index === actions.length - 1
    if (isLast) {
      button.setAttribute("is-last", "")
    }

    actionsNode.appendChild(button)

    button.innerHTML = text

    button.addEventListener("click", async () => {
      let shouldClose
      if (action) {
        shouldClose = await action()
      }
      if (shouldClose !== false) {
        node.remove()
      }
    })
  })

  if (replacesExistingModals) {
    Array.from(document.querySelectorAll("[modal-instance]")).forEach(element => {
      element.remove()
    })
  }

  document.body.appendChild(node)

  const firstElement = node.querySelector("[is-first]")
  const lastElement = node.querySelector("[is-last]")

  document.addEventListener("keydown", function (e) {
    let isTabPressed = e.key === "Tab"

    if (!isTabPressed) return

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus()
        e.preventDefault()
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus()
        e.preventDefault()
      }
    }
  })

  firstElement.focus()
}

export default getModal
