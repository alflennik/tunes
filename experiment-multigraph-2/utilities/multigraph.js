export { reconcile, element } from "./reconciler.js"

const RenderQueue = () => {
  const getFirstKey = obj => {
    for (key in obj) {
      return key
    }
  }
  const isEmpty = obj => {
    for (key in obj) {
      return false
    }
    return true
  }

  const queue = {}
  const onEmptyCallbacks = []

  const stopCount = 0

  const emptyQueue = () => {
    let firstThisUnit
    while ((firstThisUnit = getFirstKey(queue))) {
      console.log("empty queue")
      render(firstThisUnit)
      delete queue[firstThisUnit.name]
    }
  }

  return {
    isStopped: () => stopCount !== 0,

    add: thisUnit => {
      const isBlocked = !isEmpty(queue)
      if (isBlocked) {
        queue[thisUnit.name] = thisUnit
        return
      }

      queue[thisUnit.name] = thisUnit
      render(thisUnit)
      delete queue[thisUnit.name]

      emptyQueue()
    },

    stop: async promise => {
      stopCount += 1
      await promise
      stopCount -= 1

      if (stopCount === 0) emptyQueue()
    },

    onEmpty: callback => {
      onEmptyCallbacks.push(callback)
    },
  }
}

const unitDefinitions = {}
const mainRenderQueue = RenderQueue()

let updateFirst
const thisUnits = {}

export const loadGraph = async unitPaths => {
  let globals = new Set()

  await Promise.all(
    unitPaths.map(async unitPath => {
      const unitText = await fetch(unitPath).then(response => response.text())
      extractGlobals(unitText, globals)
    })
  )

  keywords.forEach(keyword => {
    window[keyword] = undefined
  })

  await Promise.all(
    unitPaths.map(async unitPath => {
      await import(unitPath)
    })
  )

  defineUnits()

  mainRenderQueue.add(updateFirst)
  Object.values(thisUnits).forEach(thisUnit => {
    mainRenderQueue.add(thisUnit)
  })
}

const extractGlobals = (text, globals) => {
  const smartMatchParentheses = () => {
    const parenMap = {}

    let isBlockComment
    let isLineComment
    // let isRegex
    let isSingleQuoteString
    let isDoubleQuoteString
    let isTildeString
    let isEscape

    let openParens = []
    let index = 0

    while (true) {
      const character = text[index]
      const twoCharacters = `${text[index]}${text[index + 1]}`

      if (isEscape) {
        isEscape = false
        index += 1
        continue
      }
      if (isTildeString) {
        if (character === "`") {
          isTildeString = false
        }
        index += 1
        continue
      }
      if (isSingleQuoteString) {
        if (character === "'") {
          isSingleQuoteString = false
        }
        index += 1
        continue
      }
      if (isDoubleQuoteString) {
        if (character === '"') {
          isDoubleQuoteString = false
        }
        index += 1
        continue
      }
      // if (isRegex) {
      //   if (character === "/") {
      //     isRegex = false
      //   }
      //   index += 1
      //   continue
      // }
      if (isLineComment) {
        if (character === "\n") {
          isLineComment = false
        }
        index += 1
        continue
      }
      if (isBlockComment) {
        if (twoCharacters === "*/") {
          isBlockComment = false
          index += 2
          continue
        }
        index += 1
        continue
      }

      if (character === "\\") {
        isEscape = true
        index += 1
        continue
      }
      if (character === "`") {
        isTildeString = true
        index += 1
        continue
      }
      if (character === "'") {
        isSingleQuoteString = true
        index += 1
        continue
      }
      if (character === '"') {
        isDoubleQuoteString = true
        index += 1
        continue
      }
      if (twoCharacters === "/*") {
        isBlockComment = true
        index += 2
        continue
      }
      if (twoCharacters === "//") {
        isLineComment = true
        index += 2
        continue
      }
      // if (character === "/") {
      //   isRegex = true
      //   index += 1
      //   continue
      // }

      if (character === "{" || character === "(" || character === "[") {
        openParens.push(index)
      } else if (character === "}" || character === ")" || character === "]") {
        const startIndex = openParens.splice(-1)[0]
        parenMap[startIndex] = index
      }

      index += 1

      if (text[index] === undefined) break
    }

    return parenMap
  }

  const parenMap = smartMatchParentheses(text)

  const matches = []
  let match
  const re = /\bdefine\s*\(\s*["']\w+["']\s*,\s*{\s*(\w+)\s*,?\s*}\s*\)\s*\(\s*\{/g
  while ((match = re.exec(text)) != null) {
    console.log("next match")
    matches.push(match)
  }

  matches.forEach(match => {
    globals.add(match[1])

    const start = match.index + match[0].length - 1
    const end = parenMap[start]
    const defineContentSuperset = text.slice(start, end)

    // Removes update part
    const updateMatch = defineContentSuperset.match(/update(First)?\s*:\s*\([^)]*\)\s*=>\s*{/)
    const updateParenStart = updateMatch.index + updateMatch[0].length - 1
    const updateStart = updateMatch.index
    const updateEnd = parenMap[start + updateParenStart] - start

    const defineContent =
      defineContentSuperset.slice(0, updateStart) + defineContentSuperset.slice(updateEnd)

    defineContent.match(/\w+/g).forEach(word => {
      globals.add(word)
    })
  })
}

const lockToUnlockMap = new Map()
const unlockToLockMap = new Map()

const lock = anyNamed => {
  if (unlockToLockMap.has(anyNamed)) return unlockToLockMap.get(anyNamed)

  const anyNamedLockedInner = {}
  const anyLastLocked = {}

  Object.entries(anyNamed.subproperties).forEach(([subpropertyName, subproperty]) => {
    anyNamedLockedInner[`$${subpropertyName}`] = lock(subproperty)
  })

  anyNamed[`$last`] = anyLastLocked

  const anyNamedLocked = new Proxy(anyNamedLockedInner, {
    get: (target, prop, receiver) => {
      if (prop === "last") {
        if (anyNamed.isInProperty) return anyNamed.lastValue
        return deepClone(anyNamed.inProperty.lastValue)
      }
      return Reflect.get(target, prop, receiver)
    },
    set: () => {
      throw new Error("Cannot set")
    },
  })

  lockToUnlockMap.set(anyNamedLocked, anyNamed)
  unlockToLockMap.set(anyNamed, anyNamedLocked)
  lockToUnlockMap.set(anyLastLocked, anyNamed.last)
  unlockToLockMap.set(anyNamed.last, anyLastLocked)

  return anyNamedLocked
}

const isLocked = anyNamedLocked => {
  return Object.isObject(anyNamedLocked) && lockToUnlockMap.has(anyNamedLocked)
}

const unlock = anyNamedLocked => {
  return lockToUnlockMap.get(anyNamedLocked)
}

const isAnyNamed = anyNamed => {
  return Object.isObject(anyNamed) && anyNamed.isAnyNamed
}

const isAnyProperty = anyProperty => {
  return Object.isObject(anyProperty) && anyProperty.isAnyProperty
}

const isAnyLast = anyLast => {
  return Object.isObject(anyLast) && anyLast.isAnyLast
}

const isAnyUnit = anyUnit => {
  return Object.isObject(anyUnit) && anyUnit.isAnyUnit
}

export const once = (anyNamedLocked, value) => {
  const anyNamed = unlock(anyNamedLocked)
  if (anyNamed.onceValue === undefined) {
    if (value === undefined) {
      throw new Error(`The second argument for once is required and cannot be undefined`)
    }
    anyNamed.onceValue = value
    return value
  } else {
    return anyNamed.onceValue
  }
}

export const doOnce = (anyNamedLocked, callback) => {
  const anyNamed = unlock(anyNamedLocked)
  if (!anyNamed.didOnce) {
    callback()
    anyNamed.didOnce = true
  }
}

export const justChanged = (anyPropertyLocked, to) => {
  const anyProperty = unlock(anyPropertyLocked)
  const inProperty = anyProperty.isInProperty ? anyProperty : anyProperty.inProperty
  const changed = inProperty.value !== inProperty.lastValue
  if (to !== undefined) {
    return changed && equivalent(anyProperty, to)
  }
  return changed
}

export const equivalent = (a, b) => {
  const getRawValue = a => {
    if (!isAnyNamed(a)) {
      return a
    }
    if (isLocked(a)) {
      a = unlock(a)
    }
    if (isAnyProperty(a)) return a.value
    if (isAnyLast(a)) return a.inProperty.lastValue
    if (isAnyUnit(a)) return a
  }
  return getRawValue(a) === getRawValue(b)
}

export const render = thisUnitLocked => {
  let thisUnit
  if (isLocked(thisUnitLocked)) {
    thisUnit = unlock(thisUnitLocked)
  } else {
    thisUnit = thisUnitLocked
  }
  Object.entries(unit.scope).forEach((name, value) => {
    window[name] = value
  })
  thisUnit.update.apply(unit.scope, {
    ripple: unit.ripple,
    stop: unit.stop,
    change: unit.change,
  })
  thisUnit.handleChanges()
  Object.keys(thisUnit.scope).forEach(name => {
    delete window[name]
  })
  return new Promise(resolve => {
    mainRenderQueue.onEmpty(resolve)
  })
}

export const define = (thisUnitName, unitConfig) => {
  unitDefinitions[thisUnitName] = unitConfig
}

const defineUnits = () => {
  const addToScope = (scope, anyNamed) => {
    const name = anyNamed.name
    const parent = anyNamed.parent
    const dollarName = `$${anyNamed.name}`

    const applyName = () => {
      scope[dollarName] = lock(anyNamed)
      scope[name] = undefined
    }
    const conflictingNamed = scope[name]
    if (conflictingNamed) {
      const isInaccessible = !conflictingNamed.parent && !parent
      if (isInaccessible) {
        throw new Error(`In define "${unitName}" found conflicting names for ${name}`)
      }
      if (!conflictingNamed.parent) {
        applyName()
      }
    } else {
      applyName()
    }
  }

  const manageProperties = {}

  Object.entries(unitDefinitions).forEach(([thisUnitName, unitConfig]) => {
    const thisUnit = {}
    thisUnits[thisUnitName] = thisUnit

    thisUnit.name = thisUnitName
    thisUnit.isUnit = true
    thisUnit.isThisUnit = true

    if (unitConfig.updateFirst) {
      if (updateFirst) throw new Error("Found multiple units trying to update first")
      updateFirst = thisUnit
      thisUnit.isUpdateFirst = true
      thisUnit.update = unitConfig.updateFirst
    } else {
      thisUnit.update = unitConfig.update
    }

    const scope = {}

    scope["$this"] = lock(thisUnit)

    thisUnit.scope = scope
    //
    ;(function defineInProperties() {
      const defineInProperty = ({ name, propertyType, parent }) => {
        const inProperty = {}
        inProperty.isAnyNamed = true
        inProperty.parent = parent
        inProperty.isAnyProperty = true
        inProperty.type = propertyType
        inProperty.isInProperty = true
        inProperty.thisUnit = thisUnit
        inProperty.last = { isAnyLast: true, isInLast: true, inProperty }

        inProperty.path = (() => {
          if (!parent) return [name]
          return [...parent.path, name]
        })()

        if (!parent.subproperties) parent.subproperties = {}
        parent.subproperties[name] = inProperty

        addToScope(thisUnit.scope, anyNamed)

        if (propertyType === "manage") {
          if (manageProperties[name]) {
            throw new Error(`Found multiple units attempting to manage "${name}"`)
          }
          receiveProperties[name] = inProperty
        }

        return inProperty
      }

      const recurse = (nameObject, data, action) => {
        Object.entries(nameObject).forEach((name, childNameObject) => {
          const childData = action(name, data)
          if (childNameObject) recurse(childNameObject, childData, action)
        })
      }

      if (unitConfig.share) {
        const action = (name, { parent }) => {
          const inProperty = defineInProperty({ name, propertyType: "share", parent })
          return { parent: inProperty }
        }
        recurse(unitConfig.receive, { parent: null }, action)
      }
      if (unitConfig.manage) {
        const action = (name, { parent }) => {
          const inProperty = defineInProperty({ name, propertyType: "manage", parent })
          return { parent: inProperty }
        }
        recurse(unitConfig.manage, { parent: null }, action)
      }
      if (unitConfig.track) {
        const action = (name, { parent }) => {
          const inProperty = defineInProperty({ name, propertyType: "track", parent })
          return { parent: inProperty }
        }
        recurse(unitConfig.manage, { parent: null }, action)
      }
    })()
  })

  Object.entries(unitDefinitions).forEach(([thisUnitName, unitConfig]) => {
    const thisUnit = thisUnits[thisUnitName]

    const defineOutUnit = ({ name }) => {
      const outUnit = {}

      outUnit.isAnyNamed = true
      outUnit.isUnit = true
      outUnit.isOutUnit = true
      outUnit.thisUnit = thisUnits[name]

      addToScope(thisUnit.scope, outUnit)

      return outUnit
    }

    const defineOutProperty = ({ name, propertyType, parent, outUnit }) => {
      const outProperty = {}
      outProperty.isAnyNamed = true
      outProperty.isAnyProperty = true
      outProperty.isOutProperty = true
      outProperty.type = propertyType
      outProperty.parent = parent
      outProperty.thisUnit = thisUnit

      outProperty.path = (() => {
        if (!parent) return [name]
        return [...parent.path, name]
      })()

      if (!parent.subproperties) parent.subproperties = {}
      parent.subproperties[name] = inProperty

      if (propertyType === "watch") {
        outProperty.outUnit = outUnit
        outProperty.inProperty = (() => {
          try {
            let findInProperty = outUnit.thisUnit
            outProperty.path.forEach(segment => {
              findInProperty = findInProperty[segment]
            })
          } catch {
            throw new Error(
              `Unit ${thisUnit.name} expected ${name} to be shared by ${outUnit.name}.`
            )
          }
        })()
      } else if (propertyType === "receive") {
        if (!manageProperties[name]) {
          throw new Error(
            `Receive property ${name} in unit ${thisUnit.name} was not managed by any other units`
          )
        }
        outProperty.inProperty = manageProperties[name]
        outProperty.outUnit = outProperty.inProperty.thisUnit
      }

      if (!outProperty.inProperty.outProperties) {
        outProperty.inProperty.outProperties = []
      }
      outProperty.inProperty.outProperties.push(outProperty)

      outProperty.last = {
        isAnyLast: true,
        isOutLast: true,
        inProperty: outProperty.inProperty,
        outProperty: outProperty,
      }

      addToScope(thisUnit.scope, outProperty)

      return outProperty
    }

    const recurse = (nameObject, data, action) => {
      Object.entries(nameObject).forEach((name, childNameObject) => {
        const childData = action(name, data)
        if (childNameObject) recurse(childNameObject, childData, action)
      })
    }

    if (unitConfig.watch) {
      const action = (name, { isOneLevelDeep, parent, outUnit }) => {
        if (isOneLevelDeep) {
          const outUnit = defineOutUnit({ name })
          return { isOneLevelDeep: false, parent: outUnit, outUnit }
        }
        const outProperty = defineOutProperty({ name, propertyType: "watch", parent, outUnit })
        return { isOneLevelDeep: false, parent: outProperty, outUnit: outUnit }
      }
      recurse(unitConfig.watch, { isOneLevelDeep: true, parent: null, outUnit: null }, action)
    }
    if (unitConfig.receive) {
      const action = (name, { parent }) => {
        const anyNamed = defineAnyNamed({
          thisUnit,
          name,
          isOutUnit: false,
          isAnyProperty: true,
          propertyType: "receive",
          parent,
        })
        return { parent: anyNamed }
      }
      recurse(unitConfig.receive, { parent: null }, action)
    }

    thisUnit.handleChanges = ({ renderQueue = mainRenderQueue } = {}) => {
      const action = (inProperty, value) => {
        inProperty.lastValue = inProperty.value
        inProperty.value = value
        if (inProperty.value !== inProperty.lastValue) {
          inProperty.outProperties.forEach(outProperty => {
            renderQueue.add(outProperty.thisUnit)
          })
        }
      }

      const recurse = (parent, value) => {
        Object.entries(parent).forEach(([childName, childAnyNamed]) => {
          let childValue
          if (value != null) {
            childValue = value[childName]
          }
          if (childAnyNamed.isInProperty) {
            const childInProperty = childAnyNamed
            action(childInProperty, childValue)
            recurse(childInProperty, childValue)
          }
        })
      }

      recurse(thisUnit.scope, thisUnitValue)
    }

    thisUnit.change = async callback => {
      callback()
      thisUnit.handleChanges()
      return new Promise(resolve => {
        mainRenderQueue.onEmpty(resolve)
      })
    }

    thisUnit.ripple = async callback => {
      callback()
      const dedicatedRenderQueue = RenderQueue()
      thisUnit.handleChanges({ renderQueue: dedicatedRenderQueue })
      return new Promise(resolve => {
        dedicatedRenderQueue.onEmpty(resolve)
      })
    }

    thisUnit.stop = async callback => {
      const promise = callback()
      await mainRenderQueue.stop(promise)
      thisUnit.handleChanges()
    }
  })
}
