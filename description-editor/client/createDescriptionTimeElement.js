import addStyle from "./utilities/addStyle.js"
import createElementHTML from "./utilities/createElementHTML.js"
import getId from "./utilities/getId.js"

const descriptionTimeClass = getId()

addStyle(`
  .${descriptionTimeClass} {
    display: flex;
    gap: 7px;
    justify-content: center;
    height: 22px;

    button {
      padding: 4px 5px;
      background: #2d52ce;
      border-radius: 4px;
    }
    input {
      width: 95px;
      text-align: center;
      background: white;
      color: black;
      border: none;
      font-family: monospace;
      border-radius: 4px;
      display: block;
    }
  }
`)

const createDescriptionTimeElement = ({
  id,
  getDescription,
  updateDescription,
  onDescriptionsChange,
}) => {
  const descriptionTimeElement = createElementHTML(`
    <div class="${descriptionTimeClass}">
      <button class="move-earlier-button" type="button" title="Move Earlier" tabindex="-1">
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
          <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
          <path
            d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 256 246.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160zm352-160l-160 160c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L301.3 256 438.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0z"
          ></path>
        </svg>
        <span class="sr-only">Move Earlier</span>
      </button>
      <button class="nudge-earlier-button" type="button" title="Nudge Earlier" tabindex="-1">
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
          <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
          <path
            d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 256 246.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"
          ></path>
        </svg>
        <span class="sr-only">Nudge Earlier</span>
      </button>
      <input class="time-input" type="text" />
      <button class="nudge-later-button" type="button" title="Nudge Later" tabindex="-1">
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
          <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
          <path
            d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"
          ></path>
        </svg>
        <span class="sr-only">Nudge Later</span>
      </button>
      <button class="move-later-button" type="button" title="Move Later" tabindex="-1">
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
          <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
          <path
            d="M470.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L402.7 256 265.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160zm-352 160l160-160c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L210.7 256 73.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0z"
          ></path>
        </svg>
        <span class="sr-only">Move Later</span>
      </button>
    </div>
  `)

  const timeInput = descriptionTimeElement.querySelector(".time-input")

  const formatTime = rawSeconds => {
    // Remove "interesting" float behavior
    const seconds = Math.round(rawSeconds * 10) / 10

    function padNumber(num, size) {
      let s = num.toString()
      while (s.length < size) {
        s = "0" + s
      }
      return s
    }

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    const decimal = Math.round((seconds % 1) * 10)

    const formattedMinutes = padNumber(minutes, 2)
    const formattedSeconds = padNumber(remainingSeconds, 2)

    return `${formattedMinutes}:${formattedSeconds}.${decimal}0`
  }

  function decodeTime(timeString) {
    const timeFormat = /^\d{2}:[0-5]\d\.\d{2}$/

    if (!timeString.match(timeFormat)) {
      return null
    }

    const [minutesString, secondsString] = timeString.split(":")

    const minutes = parseInt(minutesString, 10)
    const seconds = parseFloat(secondsString)

    const totalSeconds = minutes * 60 + seconds

    return totalSeconds
  }

  const handleChange = () => {
    const description = getDescription()

    if (!description) return // It was deleted

    const selectionStart = timeInput.selectionStart
    const selectionEnd = timeInput.selectionEnd
    timeInput.value = formatTime(description.time)
    timeInput.setSelectionRange(selectionStart, selectionEnd)
  }

  onDescriptionsChange(handleChange)
  handleChange()

  const getChangeTime = amount => () => {
    let time
    let decodedTime = decodeTime(timeInput.value)
    if (decodedTime !== null) {
      time = decodedTime
    } else {
      time = formatTime(getDescription().time)
    }

    time += amount

    if (time < 0) time = 0

    updateDescription({ id, time })
  }

  const nudgeEarlier = getChangeTime(-0.3)
  const nudgeLater = getChangeTime(0.3)
  const moveEarlier = getChangeTime(-1.2)
  const moveLater = getChangeTime(1.2)
  const increaseDecimal = getChangeTime(0.1)
  const decreaseDecimal = getChangeTime(-0.1)
  const increaseSecond = getChangeTime(1)
  const decreaseSecond = getChangeTime(-1)
  const increaseMinute = getChangeTime(60)
  const decreaseMinute = getChangeTime(-60)

  const handleTimeChange = () => {
    const time = decodeTime(timeInput.value)
    if (time === null) {
      const revertedTimeValue = formatTime(getDescription().time)
      const selectionStart = timeInput.selectionStart
      const selectionEnd = timeInput.selectionEnd
      timeInput.value = revertedTimeValue
      timeInput.setSelectionRange(selectionStart, selectionEnd)
    } else {
      updateDescription({ id, time })
    }
  }
  timeInput.addEventListener("blur", () => {
    setTimeout(() => {
      // Ignore the brief blur which occurs when the descriptions reorder
      if (timeInput !== document.activeElement) {
        handleTimeChange()
      }
    }, 1)
  })
  timeInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault()
      handleTimeChange()
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      if (timeInput.selectionEnd <= 2) {
        // 03: in 03:14.1
        increaseMinute()
      } else if (timeInput.selectionEnd > 2 && timeInput.selectionEnd <= 5) {
        // 14 in 03:14.1
        increaseSecond()
      } else {
        increaseDecimal()
      }
    } else if (event.key === "ArrowDown") {
      event.preventDefault()
      if (timeInput.selectionEnd <= 2) {
        // 03: in 03:14.1
        decreaseMinute()
      } else if (timeInput.selectionEnd > 2 && timeInput.selectionEnd <= 5) {
        // 14 in 03:14.1
        decreaseSecond()
      } else {
        decreaseDecimal()
      }
    }
  })

  descriptionTimeElement
    .querySelector(".nudge-earlier-button")
    .addEventListener("click", nudgeEarlier)
  descriptionTimeElement.querySelector(".nudge-later-button").addEventListener("click", nudgeLater)
  descriptionTimeElement
    .querySelector(".move-earlier-button")
    .addEventListener("click", moveEarlier)
  descriptionTimeElement.querySelector(".move-later-button").addEventListener("click", moveLater)

  return { descriptionTimeElement }
}

export default createDescriptionTimeElement
