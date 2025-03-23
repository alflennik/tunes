const addStyle = styleString => {
  const styleElement = document.createElement("style")
  styleElement.textContent = styleString

  const lastStyleTag = document.querySelector("head style:last-of-type")

  if (lastStyleTag) {
    document.head.insertAdjacentElement("afterend", styleElement)
  } else {
    document.head.appendChild(styleElement)
  }
}

export default addStyle
