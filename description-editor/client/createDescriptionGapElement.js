import addStyle from "./utilities/addStyle.js"
import createElementHTML from "./utilities/createElementHTML.js"
import getId from "./utilities/getId.js"

const descriptionGapClass = getId()

addStyle(`
  .${descriptionGapClass} {
    position: relative;
    display: flex;
    justify-content: center;
    margin: 12px 20px;

    &::before {
      content: "";
      display: block;
      height: 2px;
      width: 100%;
      position: absolute;
      background: #333333;
      top: 50%;
    }
    button {
      border-radius: 9px;
      align-items: center;
      display: flex;
      height: 18px;
      width: 18px;
      border: none;
      margin-left: 7px;
      background: #4f4f4f;
      position: relative;
      box-shadow: 0 0 0 6px #242424;
    }
    svg {
      fill: white;
      width: 15px;
      height: 15px;
    }
  }
`)

const createDescriptionGapElement = ({
  descriptionId = null,
  time = null,
  getDescriptions,
  createDescription,
  seekTo,
}) => {
  const descriptionGapElement = createElementHTML(`
    <div id="gap${descriptionId}" class="${descriptionGapClass}">
      <button class="play-from-here-button" type="button" title="Play From Here">
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
          <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
          <path
            d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"
          ></path>
        </svg>
        <span class="sr-only">Play From Here</span>
      </button>
      <button class="add-description-button" type="button" title="Add Description Here">
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
          <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
          <path
            d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"
          ></path>
        </svg>
        <span class="sr-only">Add Description Here</span>
      </button>
    </div>
  `)

  const getTime = () => {
    let newTime
    if (descriptionId) {
      newTime = getDescriptions().find(description => description.id === descriptionId).time + 1
    } else {
      newTime = time
    }
    return newTime
  }

  descriptionGapElement.querySelector(".play-from-here-button").addEventListener("click", () => {
    seekTo(getTime())
  })

  descriptionGapElement.querySelector(".add-description-button").addEventListener("click", () => {
    let newTime = getTime()
    const { id: newId } = createDescription({ time: newTime })
    document.querySelector(`#${newId} textarea`).focus()
  })

  return { descriptionGapElement }
}

export default createDescriptionGapElement
