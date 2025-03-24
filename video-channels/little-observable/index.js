let queuePausedCount = 0
const updateQueue = []

const createObservable = startValue => {
  let value = startValue

  const listeners = []

  const getValue = () => value

  const update = newValue => {
    value = newValue
    if (queuePausedCount === 0) {
      listeners.forEach(listener => listener())
    } else {
      updateQueue.push(listeners)
    }
  }

  const onChange = listener => {
    listeners.push(listener)
    listener()
  }

  const getReadOnly = () => {
    return {
      getValue,
      onChange,
      update: () => {
        throw new Error("Cannot update a read-only observable")
      },
      getReadOnly: () => {
        throw new Error("This observable is already read-only")
      },
    }
  }

  return {
    getValue,
    update,
    onChange,
    getReadOnly,
  }
}

const onObservableChanges = (observables, listener) => {
  observables.forEach(observable => {
    observable.onChange(listener)
  })
}

const groupObservableUpdates = updateFunction => {
  queuePausedCount += 1
  updateFunction()
  queuePausedCount -= 1

  if (queuePausedCount === 0) {
    // Flush the queue
    let listeners
    while ((listeners = updateQueue.splice(0, 1)[0])) {
      listeners.forEach(listener => listener())
    }
  }
}

export { createObservable, onObservableChanges, groupObservableUpdates }
