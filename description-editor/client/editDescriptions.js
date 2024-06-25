const editDescriptions = () => {
  const getId = () => `id${Math.random().toString().slice(2, 9)}`

  const cloneData = data => JSON.parse(JSON.stringify(data))

  let descriptions = []

  const sortDescriptions = () => {
    descriptions.sort((a, b) => a.time - b.time)
  }

  const history = []

  const addToHistory = () => {
    history.push(cloneData(descriptions))
    if (history.length >= 200) {
      history.splice(0, 1)
    }
  }

  const listeners = []
  const notifyListeners = () => {
    listeners.forEach(listener => listener())
  }

  return {
    getDescriptions: () => descriptions,

    onDescriptionsChange: listener => {
      listeners.push(listener)
    },

    createDescription: ({ time }) => {
      addToHistory()
      descriptions.push({ id: getId(), time, text: "", ssml: null })
      sortDescriptions()
      notifyListeners()
    },

    updateDescription: ({ id, time, text, ssml }) => {
      addToHistory()
      const index = descriptions.findIndex(description => description.id === id)
      const newDescription = cloneData(descriptions[index])
      if (time != null) newDescription.time = time
      if (text != null) newDescription.text = text
      if (ssml != null) newDescription.ssml = ssml
      descriptions[index] = newDescription
      sortDescriptions()
      notifyListeners()
    },

    deleteDescription: id => {
      addToHistory()
      const index = descriptions.findIndex(description => description.id === id)
      descriptions = descriptions.splice(index, 1)
      notifyListeners()
    },
  }
}
