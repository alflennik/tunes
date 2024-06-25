const getDescription = ({
  styleNode,
  node,
  id,
  getDescriptions,
  updateDescription,
  onDescriptionsChange,
}) => {
  if (!styleNode.hasChildNodes()) {
    styleNode.innerHTML = /* HTML */ `
      <style>
        .description {
          padding: 7px 20px;
        }
        .description textarea {
          width: 100% !important;
          background: #313131;
          border: none;
          color: white;
          height: 100px;
          font-size: 15px;
          line-height: 1.4;
          box-sizing: border-box;
          display: block;
          padding: 4px;
          border-radius: 4px;
        }
        .description-actions {
          display: flex;
          gap: 7px;
          padding: 0px 0px 7px;
        }
        .description-actions button {
          border: none;
          display: flex;
          align-items: center;
        }
        .description-actions svg {
          fill: white;
          width: 14px;
          height: 14px;
        }
        .description-time {
          flex-grow: 1;
          display: flex;
          gap: 7px;
          justify-content: center;
          height: 22px;
        }
        .description-time button {
          padding: 4px 5px;
          background: #2d52ce;
          border-radius: 4px;
        }
        .description-time input {
          width: 60px;
          text-align: center;
          background: white;
          color: black;
          border: none;
          font-family: monospace;
          border-radius: 4px;
          display: block;
        }
        .description-actions > button {
          padding: 4px 18px;
          background: #313131;
          border-radius: 4px;
        }
        .description-provide-ssml {
          font-family: monospace;
          font-weight: bold;
          margin-bottom: 4px;
          display: block;
        }
      </style>
    `
  }

  node.innerHTML = /* HTML */ `
    <div class="description">
      <div class="description-actions">
        <button type="button" title="Play From Here">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
            <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
            <path
              d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"
            ></path>
          </svg>
          <span class="sr-only">Play From Here</span>
        </button>
        <div class="description-time">
          <button type="button" title="Move Earlier">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
              <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
              <path
                d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 256 246.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160zm352-160l-160 160c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L301.3 256 438.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0z"
              ></path>
            </svg>
            <span class="sr-only">Move Earlier</span>
          </button>
          <button type="button" title="Nudge Earlier">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
              <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
              <path
                d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 256 246.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"
              ></path>
            </svg>
            <span class="sr-only">Nudge Earlier</span>
          </button>
          <input time type="text" value="0:01.1" />
          <button type="button" title="Nudge Later">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
              <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
              <path
                d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"
              ></path>
            </svg>
            <span class="sr-only">Nudge Later</span>
          </button>
          <button type="button" title="Move Later">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
              <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
              <path
                d="M470.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L402.7 256 265.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160zm-352 160l160-160c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L210.7 256 73.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0z"
              ></path>
            </svg>
            <span class="sr-only">Move Later</span>
          </button>
        </div>
        <button class="description-delete" type="button" title="Delete">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
            <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
            <path
              d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h96l7.2-14.3zM32 128H416V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V128zm96 64c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16z"
            ></path>
          </svg>
          <span class="sr-only">Delete</span>
        </button>
      </div>
      <textarea text></textarea>
      <label class="description-provide-ssml"
        ><input type="checkbox" checked="" /> Provide SSML</label
      >
      <textarea>
&lt;prosody rate="+40%"&gt;Smoke rises from the chimney of a sad little hovel ... in a place that is ... definitely ...&lt;/prosody&gt; &lt;prosody rate="+30%"&gt;not America.&lt;/prosody&gt;</textarea
      >
    </div>
  `

  let description = getDescriptions().find(description => description.id === id)

  const textTextarea = node.querySelector("[text]")
  textTextarea.addEventListener("input", () => {
    updateDescription({ id, text: textTextarea.value })
  })

  const handleChange = () => {
    description = getDescriptions().find(description => description.id === id)

    node.querySelector("[time]").value = description.time

    const textSelectionStart = textTextarea.selectionStart
    const textSelectionEnd = textTextarea.selectionEnd
    textTextarea.value = description.text
    textTextarea.focus()
    textTextarea.setSelectionRange(textSelectionStart, textSelectionEnd)
  }

  onDescriptionsChange(handleChange)
  handleChange()
}
