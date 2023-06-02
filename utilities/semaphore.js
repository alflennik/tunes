export default () => {
  const waiting = []

  return callback => {
    const isBlocked = waiting.length
    if (isBlocked) {
      waiting.push(callback)
      return
    }

    waiting.push(callback)
    callback()
    waiting.shift()

    while (waiting.length > 0) {
      const secondaryCallback = waiting.shift()
      secondaryCallback()
    }
  }
}
