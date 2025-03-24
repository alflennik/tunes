import getId from "./utilities/getId.js"

const editDescriptions = async ({ savedContentMutable }) => {
  const cloneData = data => JSON.parse(JSON.stringify(data))

  let descriptions = cloneData(savedContentMutable.getValue().descriptions)

  savedContentMutable.onChange(() => {
    descriptions = cloneData(savedContentMutable.getValue().descriptions)
  })

  const commitDescriptions = () => {
    savedContentMutable.update({ ...savedContentMutable.getValue(), descriptions })
  }

  const sortDescriptions = () => {
    descriptions.sort((a, b) => a.time - b.time)
  }

  await loadObjectHash()
  const getDescriptionsHash = () => objectHash(descriptions)

  const history = []

  const addToHistory = () => {
    history.push({ hash: getDescriptionsHash(), descriptions: cloneData(descriptions) })
    if (history.length >= 200) {
      history.splice(0, 1)
    }
  }

  return {
    getDescriptionsHash,

    createDescription: ({ time }) => {
      addToHistory()
      const id = getId()
      descriptions.push({ id, time, text: "", ssml: null })
      sortDescriptions()
      commitDescriptions()
      return { id }
    },

    updateDescription: ({ id, time, text, ssml }) => {
      addToHistory()
      const index = descriptions.findIndex(description => description.id === id)
      const newDescription = cloneData(descriptions[index])
      if (time != null) newDescription.time = time
      if (text != null) newDescription.text = text
      if (ssml !== undefined) newDescription.ssml = ssml
      descriptions[index] = newDescription
      sortDescriptions()
      commitDescriptions()
    },

    deleteDescription: id => {
      addToHistory()
      const index = descriptions.findIndex(description => description.id === id)
      descriptions.splice(index, 1)
      const previousId = descriptions[index - 1] ? descriptions[index - 1].id : null
      commitDescriptions()
      return previousId
    },
  }
}

const loadObjectHash = async () => {
  const scriptElement = document.createElement("script")
  scriptElement.src = "/node_modules/object-hash/dist/object_hash.js"
  const firstScriptTag = document.getElementsByTagName("script")[0]
  firstScriptTag.parentNode.insertBefore(scriptElement, firstScriptTag)
  // Waiting for the script's "load" event didn't work so polling is necessary instead
  await new Promise(resolve => {
    const intervalId = setInterval(() => {
      if (typeof objectHash === "function") {
        clearInterval(intervalId)
        resolve()
      }
    }, 3)
  })
  // objectHash is now a global variable
}

export default editDescriptions
