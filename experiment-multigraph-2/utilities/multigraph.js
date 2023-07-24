export { reconcile, element } from "./reconciler.js"

const canProxy = value => {
  value !== null && (typeof value === "object" || typeof value === "function")
}

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

  globals.forEach(name => {
    window[name] = undefined
  })

  await Promise.all(
    unitPaths.map(async unitPath => {
      await import(unitPath)
    })
  )

  defineUnits()

  if (updateFirst) {
    mainRenderQueue.add(updateFirst)
  }
  Object.values(thisUnits).forEach(thisUnit => {
    if (thisUnit !== updateFirst) {
      mainRenderQueue.add(thisUnit)
    }
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
  const re = /\bdefine\s*\(\s*["']\w+["']\s*,\s*{/g
  while ((match = re.exec(text)) != null) {
    matches.push(match)
  }

  matches.forEach(match => {
    const start = match.index + match[0].length - 1
    const end = parenMap[start]
    const defineContentSuperset = text.slice(start, end)

    // Removes update part
    const updateMatch = defineContentSuperset.match(
      /update(First)?\s*:\s*(\([^)]*\)\s*=>\s*|function\s*\(\s*[^\)]*\)\s*){/
    )
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

  if (anyNamed.subproperties) {
    Object.entries(anyNamed.subproperties).forEach(([subpropertyName, subproperty]) => {
      anyNamedLockedInner[`$${subpropertyName}`] = lock(subproperty)
    })
  }

  anyNamed[`$last`] = anyLastLocked

  const anyNamedLocked = new Proxy(anyNamedLockedInner, {
    get: (target, prop, receiver) => {
      if (prop === "isInitialRender" && anyNamed.isThisUnit) return !anyNamed.hasRenderedOnce
      if (prop === "last") {
        if (anyNamed.isInProperty) return anyNamed.lastValue
        return anyNamed.inProperty.lastValue
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
  return (
    anyNamedLocked !== null &&
    typeof anyNamedLocked === "object" &&
    lockToUnlockMap.has(anyNamedLocked)
  )
}

const unlock = anyNamedLocked => {
  return lockToUnlockMap.get(anyNamedLocked)
}

const isAnyNamed = anyNamed => {
  return anyNamed !== null && typeof anyNamed === "object" && anyNamed.isAnyNamed
}

const isAnyProperty = anyProperty => {
  return anyProperty !== null && typeof anyProperty === "object" && anyProperty.isAnyProperty
}

const isAnyLast = anyLast => {
  return anyLast !== null && typeof anyLast === "object" && anyLast.isAnyLast
}

const isAnyUnit = anyUnit => {
  return anyUnit !== null && typeof anyUnit === "object" && anyUnit.isAnyUnit
}

export const once = (anyNamedLocked, value) => {
  const anyNamed = unlock(anyNamedLocked)
  if (!anyNamed) debugger
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

export const render = anyUnitLocked => {
  const thisUnit = (() => {
    const anyUnit = isLocked(anyUnitLocked) ? unlock(anyUnitLocked) : anyUnitLocked
    return anyUnit.isThisUnit ? anyUnit : anyUnit.thisUnit
  })()

  Object.entries(thisUnit.scope).forEach(([name, value]) => {
    window[name] = value
  })

  thisUnit.update.call(thisUnit.scope, {
    ripple: thisUnit.ripple,
    stop: thisUnit.stop,
    change: thisUnit.change,
  })

  if (thisUnit.hasRenderedOnce === undefined) {
    thisUnit.hasRenderedOnce = true
  }

  return new Promise(resolve => {
    mainRenderQueue.onEmpty(resolve)

    thisUnit.handleChanges({ isWindowScoped: true })

    Object.keys(thisUnit.scope).forEach(name => {
      delete window[name]
    })
  })
}

export const define = (thisUnitName, unitConfig) => {
  unitDefinitions[thisUnitName] = unitConfig
}

const defineUnits = () => {
  const addToScope = (scope, name, anyNamed) => {
    const parent = anyNamed.parent

    const applyName = () => {
      anyNamed.isInRootOfScope = true
      scope[`$${name}`] = lock(anyNamed)
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

    thisUnit.subproperties = {}

    const scope = {}

    scope["$this"] = lock(thisUnit)

    thisUnit.scope = scope
    //
    ;(function defineInProperties() {
      const defineInProperty = ({ name, propertyType, parent }) => {
        const inProperty = {}
        inProperty.name = name
        inProperty.isAnyNamed = true
        inProperty.parent = parent
        inProperty.isAnyProperty = true
        inProperty.type = propertyType
        inProperty.isInProperty = true
        inProperty.thisUnit = thisUnit
        inProperty.last = { isAnyLast: true, isInLast: true, inProperty }

        inProperty.path = (() => {
          if (!parent?.path) return [name]
          return [...parent.path, name]
        })()

        inProperty.subproperties = {}
        if (parent) {
          parent.subproperties[name] = inProperty
        }

        addToScope(thisUnit.scope, name, inProperty)

        if (propertyType === "manage") {
          if (manageProperties[name]) {
            throw new Error(`Found multiple units attempting to manage "${name}"`)
          }
          manageProperties[name] = inProperty
        }

        return inProperty
      }

      const recurse = (nameObject, data, action) => {
        Object.entries(nameObject).forEach(([name, childNameObject]) => {
          const childData = action(name, data)
          if (childNameObject) recurse(childNameObject, childData, action)
        })
      }

      if (unitConfig.share) {
        const action = (name, { parent }) => {
          const inProperty = defineInProperty({ name, propertyType: "share", parent })
          return { parent: inProperty }
        }
        recurse(unitConfig.share, { parent: thisUnit }, action)
      }
      if (unitConfig.manage) {
        const action = (name, { parent }) => {
          const inProperty = defineInProperty({ name, propertyType: "manage", parent })
          return { parent: inProperty }
        }
        recurse(unitConfig.manage, { parent: thisUnit }, action)
      }
      if (unitConfig.track) {
        const action = (name, { parent }) => {
          const inProperty = defineInProperty({ name, propertyType: "track", parent })
          return { parent: inProperty }
        }
        recurse(unitConfig.track, { parent: thisUnit }, action)
      }
    })()
  })

  Object.entries(unitDefinitions).forEach(([thisUnitName, unitConfig]) => {
    const thisUnit = thisUnits[thisUnitName]

    const defineOutUnit = ({ name }) => {
      const outUnit = {}

      outUnit.name = name
      outUnit.isAnyNamed = true
      outUnit.isUnit = true
      outUnit.isOutUnit = true
      outUnit.thisUnit = thisUnits[name]
      if (!outUnit.thisUnit) {
        throw new Error(`Unit ${thisUnitName} referenced unit ${name} which does not exist`)
      }

      addToScope(thisUnit.scope, name, outUnit)

      return outUnit
    }

    const defineOutProperty = ({ name, propertyType, parent, outUnit }) => {
      const outProperty = {}
      outProperty.name = name
      outProperty.isAnyNamed = true
      outProperty.isAnyProperty = true
      outProperty.isOutProperty = true
      outProperty.type = propertyType
      outProperty.parent = parent
      outProperty.thisUnit = thisUnit

      outProperty.path = (() => {
        if (!parent?.path) return [name]
        return [...parent.path, name]
      })()

      if (parent) {
        if (!parent.subproperties) parent.subproperties = {}
        parent.subproperties[name] = outProperty
      }

      if (propertyType === "watch") {
        outProperty.outUnit = outUnit
        outProperty.inProperty = (() => {
          try {
            let findInProperty = outUnit.thisUnit
            outProperty.path.forEach(segment => {
              findInProperty = findInProperty.subproperties[segment]
            })
            if (!findInProperty) throw true
            return findInProperty
          } catch {
            throw new Error(
              `Unit ${thisUnit.name} expected ${name} to be shared by ${outUnit.name}.`
            )
          }
        })()
        if (!outProperty.inProperty) debugger
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

      outProperty.readOnlyProxy = new Proxy(() => {}, {
        apply: (_, thisArg, argumentsList) => {
          return outProperty.inProperty.value.apply(thisArg, argumentsList)
        },
        get: (_, prop) => {
          const rawValue = outProperty.subproperties[prop].value
          if (!canProxy(rawValue)) return rawValue
          return outProperty.subproperties[prop].readOnlyProxy
        },
        set: () => {
          throw new Error("Cannot set")
        },
      })

      addToScope(thisUnit.scope, name, outProperty)

      return outProperty
    }

    const recurse = (nameObject, data, action) => {
      Object.entries(nameObject).forEach(([name, childNameObject]) => {
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
        const outProperty = defineOutProperty({ name, propertyType: "receive", parent })
        return { parent: outProperty }
      }
      recurse(unitConfig.receive, { parent: null }, action)
    }

    thisUnit.handleChanges = ({ isWindowScoped, renderQueue = mainRenderQueue }) => {
      const action = (inProperty, value) => {
        inProperty.lastValue = inProperty.value
        inProperty.value = value
        if (inProperty.value !== inProperty.lastValue) {
          inProperty.outProperties.forEach(outProperty => {
            if (outProperty.isInRootOfScope) {
              if (!canProxy(value)) {
                outProperty.thisUnit.scope[outProperty.name] = value
              } else if (
                outProperty.thisUnit.scope[outProperty.name] !== outProperty.readOnlyProxy
              ) {
                outProperty.thisUnit.scope[outProperty.name] = outProperty.readOnlyProxy
              }
            }
            renderQueue.add(outProperty.thisUnit)
          })
        }
      }

      const recurse = ({ thisUnit, parent, parentValue }) => {
        if (!parent.subproperties) debugger
        Object.values(parent.subproperties).forEach(anyNamed => {
          if (anyNamed.isInProperty) {
            const inProperty = anyNamed
            let value = (() => {
              if (parent === thisUnit) {
                if (isWindowScoped) {
                  value = window[inProperty.name]
                } else {
                  value = thisUnit.scope[inProperty.name]
                }
              } else {
                value = parentValue?.[inProperty.name]
              }
            })()
            action(inProperty, value)
            recurse(inProperty, value)
          }
        })
      }

      recurse({ thisUnit, parent: thisUnit, parentValue: undefined })
    }

    thisUnit.change = async callback => {
      callback()
      thisUnit.handleChanges({ isWindowScoped: false })
      return new Promise(resolve => {
        mainRenderQueue.onEmpty(resolve)
      })
    }

    thisUnit.ripple = async callback => {
      callback()
      const dedicatedRenderQueue = RenderQueue()
      thisUnit.handleChanges({ isWindowScoped: false, renderQueue: dedicatedRenderQueue })
      return new Promise(resolve => {
        dedicatedRenderQueue.onEmpty(resolve)
      })
    }

    thisUnit.stop = async callback => {
      const promise = callback()
      await mainRenderQueue.stop(promise)
      thisUnit.handleChanges({ isWindowScoped: false })
    }
  })
}
