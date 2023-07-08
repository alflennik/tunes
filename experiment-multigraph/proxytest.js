let _value
const value = () => _value

const setContext = (val, component) => {
  const _ = {
    value: () => {
      _value = val
      const result = value()
      _value = undefined

      return result
    },
  }

  _value = val
  const result = component.update({ _ })
  _value = undefined

  return result
}

const component1 = {
  update: () => {
    return value()
  },
}

const component2 = {
  update: () => {
    return value()
  },
}

const component3 = {
  update: ({ _ }) => {
    return _.value()
  },
}

console.log("component1", setContext("1", component1))

console.log("component2", setContext("2", component2))

console.log("component3", setContext("3", component3))
