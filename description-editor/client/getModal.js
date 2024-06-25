let styleNode

const getModal = ({ title, body, actions }) => {
  const id = `id${Math.random().toString().substr(2, 9)}`

  if (!styleNode) {
    styleNode = document.createElement("div")
    document.body.appendChild(styleNode)
    styleNode.innerHTML = /* HTML */ `
      <style>
        .modal-shade {
          position: fixed;
          inset: 0;
          background: #000000a1;
        }
        .modal {
          background: #2c2c2c;
          border: 12px solid #1e1e1e;
          width: 100%;
          max-width: 500px;
          margin: 170px auto;
          border-radius: 15px;
          font-family: monospace;
        }
        .modal .title {
          padding: 24px 24px 18px 24px;
        }
        .modal .title h1 {
          margin: 0;
          line-height: 1;
          font-size: 19px;
          display: inline-block;
        }
        .modal .body {
          padding: 0 24px 24px;
          border-bottom: 4px solid #1e1e1e;
        }
        .modal .actions {
          padding: 10px 24px;
          display: flex;
          justify-content: end;
          gap: 10px;
        }
        .modal .actions button {
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
        .modal .actions button:first-of-type {
          background: #2d52ce;
        }
      </style>
    `
  }

  const node = document.createElement("div")

  node.setAttribute("id", id)
  node.setAttribute("class", "modal-shade")
  node.innerHTML = /* HTML */ `
    <div class="modal">
      <div class="title">
        <h1>${title}</h1>
      </div>
      <div class="body">${body}</div>
      <div actions class="actions"></div>
    </div>
  `

  const actionsNode = node.querySelector("[actions]")

  actions.forEach(({ text, action }, index) => {
    const button = document.createElement("button")
    button.setAttribute("type", "button")

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
      if (action) await action()
      node.remove()
    })
  })

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
