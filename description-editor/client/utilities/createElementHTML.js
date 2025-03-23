const createElementHTML = html => {
  const temp = document.createElement("div")
  temp.innerHTML = html
  return temp.firstElementChild
}

export default createElementHTML
