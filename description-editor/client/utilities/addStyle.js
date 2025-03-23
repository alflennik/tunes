const addStyle = styleString => {
  const hash = insecureHash(styleString)

  if (document.querySelector(`style[data-hash="${hash}"]`)) {
    return
  }

  const styleElement = document.createElement("style")
  styleElement.textContent = styleString
  styleElement.setAttribute("data-hash", hash)

  const lastStyleTag = document.querySelector("head style:last-of-type")

  if (lastStyleTag) {
    document.head.insertAdjacentElement("afterend", styleElement)
  } else {
    document.head.appendChild(styleElement)
  }
}

// https://stackoverflow.com/questions/6122571/simple-non-secure-hash-function-for-javascript
const insecureHash = str => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
  }
  return (hash >>> 0).toString(36).padStart(7, "0")
}

export default addStyle
