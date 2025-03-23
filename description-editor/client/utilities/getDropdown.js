import addStyle from "./addStyle.js"
import createElementHTML from "./createElementHTML.js"
import getId from "./getId.js"

const dropdownClass = getId()

addStyle(`
  .${dropdownClass} {
    position: relative;

    &.closed .dropdown-menu {
      display: none;
    }
    .dropdown-menu {
      margin: 0;
      padding: 0;
      list-style-type: none;
      width: 190px;
      background: #5d5d5d;
      position: absolute;
      bottom: 37px;
      right: 2px;
      border-radius: 7px;
      border: 8px solid #4c4c4c;
      color: white;
      box-shadow: 0 0 150px 0 black;
    }
    & > button {
      position: relative;
    }
    .dropdown-menu button {
      position: relative;
      line-height: 40px;
      padding: 0 10px;
      display: block;
      border: none;
      border-bottom: 4px solid #4c4c4c;
      background: #5d5d5d;
      width: 100%;
      text-align: left;
      color: white;
      cursor: pointer;
      transition: background linear 200ms;
    }
    .dropdown-menu li:last-of-type button {
      border-bottom: none;
    }
    .dropdown-menu button:hover {
      background: #777777;
    }
  }
`)

const getDropdown = ({ node, button, items }) => {
  // const dropdownElement = createElementHTML(`<div></div>`)

  // const dropdownMenuElement = createElementHTML(`<ul></ul>`)
  // dropdownElement.appendChild(dropdownMenuElement)

  // onObservableChanges([itemsObservable], () => {
  //   const itemElements = itemsObservable.getValue().map(item => {
  //     const idFormatted = item.id ? `id="${item.id}"` : ""
  //     return createElementHTML(`<li ${idFormatted}><button type="button">${item.label}</button></li>`)
  //   })
  //   dropdownMenuElement.replaceChildren(...itemElements)
  // })

  node.innerHTML = /* HTML */ `
    <div class="${dropdownClass}">
      <ul class="dropdown-menu"></ul>
      ${button}
    </div>
  `

  const dropdownElement = node.querySelector(`.${dropdownClass}`)
  const buttonElement = node.querySelector(`.${dropdownClass} > button`)
  const dropdownMenuElement = node.querySelector(".dropdown-menu")

  const openDropdown = () => {
    dropdownElement.classList.add("open")
    dropdownElement.classList.remove("closed")
  }

  const closeDropdown = () => {
    dropdownElement.classList.remove("open")
    dropdownElement.classList.add("closed")
  }

  const toggleDropdown = () => {
    if (dropdownElement.classList.contains("open")) {
      closeDropdown()
    } else {
      openDropdown()
    }
  }

  buttonElement.addEventListener("click", () => {
    toggleDropdown()
  })

  document.addEventListener("click", event => {
    if (!dropdownElement.contains(event.target)) {
      closeDropdown()
    }
  })

  const itemElements = items.map(item => {
    item.buttonElement.addEventListener("click", closeDropdown)

    const li = createElementHTML(`<li></li>`)
    li.appendChild(item.buttonElement)
    return li
  })

  dropdownMenuElement.replaceChildren(...itemElements)

  closeDropdown()
}

export default getDropdown
