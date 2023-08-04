export { reconcile, element, fragment } from "./reconciler.js"

const canProxy = value => {
  return value !== null && (typeof value === "object" || typeof value === "function")
}

const RenderQueue = () => {
  const getFirstKey = obj => {
    for (const key in obj) {
      return key
    }
  }
  const isEmpty = obj => {
    for (const key in obj) {
      return false
    }
    return true
  }

  const queue = {}
  const onEmptyCallbacks = []

  let stopCount = 0

  const emptyQueue = () => {
    let firstThisUnit
    while ((firstThisUnit = getFirstKey(queue))) {
      render(firstThisUnit)
      delete queue[firstThisUnit.name]
    }
  }

  return {
    isStopped: () => stopCount !== 0,

    add: thisUnit => {
      const isBlocked = !isEmpty(queue) || stopCount !== 0
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

const anyOutToAnyOutValueMap = new Map()
const anyOutValueToAnyOutMap = new Map()

const isAnyOutValue = anyOutValue => {
  return !!anyOutValueToAnyOutMap.get(anyOutValue)
}

const getAnyOutFromValue = anyOutValue => {
  return anyOutValueToAnyOutMap.get(anyOutValue)
}

const getAnyOutValue = (anyOut, value) => {
  const getGoodDebuggingExperienceObject = anyOut => {
    return Object.fromEntries(Object.keys(anyOut.subproperties).map(key => [key, "[[value]]"]))
  }

  let isProxy = true

  const anyOutValue = (() => {
    if (anyOut.isOutUnit) {
      return new Proxy(getGoodDebuggingExperienceObject(anyOut), {
        get: (_, key) => {
          if (!anyOut.subproperties[key]) return undefined
          return getAnyOutValue(anyOut.subproperties[key], anyOut.thisUnit.subproperties[key].value)
        },
        set: () => {
          throw new Error("Cannot set")
        },
      })
    }

    if (!anyOut.isOutProperty) throw new Error("Unexpected Type")

    if (!canProxy(value)) {
      isProxy = false
      return value
    }

    if (typeof value === "function") {
      return new Proxy(value, {
        apply: (value, thisArg, argumentsList) => {
          return value.apply(thisArg, argumentsList)
        },
        set: () => {
          throw new Error("Cannot set")
        },
      })
    }

    if (Array.isArray(value)) {
      return new Proxy(value, {
        set: () => {
          throw new Error("Cannot set")
        },
      })
    }

    if (typeof value === "object") {
      return new Proxy(getGoodDebuggingExperienceObject(anyOut), {
        get: (_, key) => {
          if (!anyOut.inProperty.subproperties[key]) {
            debugger
            throw new Error(`Property ${key} does not exist`)
          }
          const rawValue = anyOut.inProperty.subproperties[key].value
          if (!canProxy(rawValue)) return rawValue
          if (!anyOut.subproperties[key]) return undefined
          return getAnyOutValue(anyOut.subproperties[key], rawValue)
        },
        set: () => {
          throw new Error("Cannot set")
        },
      })
    }

    throw new Error("Encountered unexpected type")
  })()

  if (isProxy) {
    anyOutValueToAnyOutMap.set(anyOutValue, anyOut)
    anyOutToAnyOutValueMap.set(anyOut, anyOutValue)
  }

  return anyOutValue
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

  defineAllNamed()

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

  const anyLastLocked = {}

  const anyNamedLocked = new Proxy(anyNamed, {
    get: (_, prop) => {
      if (prop === "isInitialRender" && anyNamed.isThisUnit) return !anyNamed.hasRenderedOnce
      if (prop === "last") {
        if (anyNamed.isInProperty) return anyNamed.lastValue
        return anyNamed.inProperty.lastValue
      }
      if (prop === "$last") return anyLastLocked
      if (prop.startsWith("$")) return lock(anyNamed.subproperties[prop.split("$")[1]])
      return undefined
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

  const result = thisUnit.update.call(thisUnit.scope, {
    ripple: thisUnit.ripple,
    stop: thisUnit.stop,
    change: thisUnit.change,
  })

  if (thisUnit.hasRenderedOnce === undefined) {
    thisUnit.hasRenderedOnce = true
  }

  let stoppedPromise
  if (thisUnit.stopCount === 0) {
    thisUnit.handleChanges({ isWindowScoped: true })
  } else if (result?.then) {
    stoppedPromise = result
  }

  Object.keys(thisUnit.scope).forEach(name => {
    delete window[name]
  })

  return stoppedPromise
}

export const define = (thisUnitName, unitConfig) => {
  unitDefinitions[thisUnitName] = unitConfig
}

const defineAllNamed = () => {
  const defineThisUnit = ({ name, unitConfig }) => {
    const thisUnit = {}

    thisUnit.name = name
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
    thisUnit.stopCount = 0

    const scope = {}

    scope["$this"] = lock(thisUnit)

    thisUnit.scope = scope

    thisUnits[name] = thisUnit
  }

  const addToScope = (scope, name, anyNamed) => {
    const parent = anyNamed.parent

    const applyName = () => {
      anyNamed.isInRootOfScope = true
      scope[`$${name}`] = lock(anyNamed)
      scope[name] = undefined
    }

    const unapplyName = () => {
      unlock(scope[`$${name}`]).isInRootOfScope = false
      delete scope[$`$${name}`]
      delete scope[name]
    }

    const conflictingNamed = scope[name] && !unlock(scope[`$${name}`]).isOutUnit
    // Since manage and watch both have unit names, there isn't actually a conflict here
    if (conflictingNamed) {
      const isInaccessible = !conflictingNamed.parent && !parent
      if (isInaccessible) {
        throw new Error(`In define "${unitName}" found conflicting names for ${name}`)
      }
      if (!conflictingNamed.parent) {
        applyName()
      } else {
        unapplyName()
      }
    } else {
      applyName()
    }
  }

  const defineOutUnit = ({ name, thisUnit }) => {
    const outUnit = {}

    outUnit.name = name
    outUnit.isAnyNamed = true
    outUnit.isUnit = true
    outUnit.isOutUnit = true
    outUnit.thisUnit = thisUnits[name]
    if (!outUnit.thisUnit) {
      throw new Error(`Unit ${thisUnitName} referenced unit ${name} which does not exist`)
    }

    outUnit.subproperties = {}

    addToScope(thisUnit.scope, name, outUnit)

    return outUnit
  }

  const defineInProperty = ({ name, propertyType, parent, thisUnit }) => {
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

    inProperty.outProperties = []

    addToScope(thisUnit.scope, name, inProperty)

    if (propertyType === "manage") {
      if (manageProperties[name]) {
        throw new Error(`Found multiple units attempting to manage "${name}"`)
      }
      manageProperties[name] = inProperty
    }

    return inProperty
  }

  const defineOutProperty = ({ name, propertyType, parent, outUnit, thisUnit }) => {
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

    outProperty.subproperties = {}
    if (parent) {
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
          throw new Error(`Unit ${thisUnit.name} expected ${name} to be shared by ${outUnit.name}.`)
        }
      })()
    } else if (propertyType === "receive") {
      if (!manageProperties[name]) {
        throw new Error(
          `Receive property ${name} in unit ${thisUnit.name} was not managed by any other units`
        )
      }
      outProperty.inProperty = manageProperties[name]
    }

    outProperty.inProperty.outProperties.push(outProperty)

    outProperty.last = {
      isAnyLast: true,
      isOutLast: true,
      inProperty: outProperty.inProperty,
      outProperty: outProperty,
    }

    addToScope(thisUnit.scope, name, outProperty)

    return outProperty
  }

  /* Define AllNamed. It needs to happen in a specific order. First are thisUnits, then outUnits,
  then inProperties, then outProperties. */

  const manageProperties = {}

  /* ThisUnits */
  Object.entries(unitDefinitions).forEach(([name, unitConfig]) => {
    defineThisUnit({ name, unitConfig })
  })

  /* OutUnits */
  Object.entries(unitDefinitions).forEach(([thisUnitName, unitConfig]) => {
    const thisUnit = thisUnits[thisUnitName]

    if (unitConfig.watch || unitConfig.manage) {
      if (unitConfig.watch) {
        Object.keys(unitConfig.watch).forEach(name => {
          const outUnit = defineOutUnit({ name, thisUnit })
          thisUnit.subproperties[name] = outUnit
        })
      }
      if (unitConfig.manage) {
        Object.keys(unitConfig.manage).forEach(name => {
          if (thisUnit.subproperties[name]) return
          const outUnit = defineOutUnit({ name, thisUnit })
          thisUnit.subproperties[name] = outUnit
        })
      }
    }
  })

  /* InProperties */
  Object.entries(unitDefinitions).forEach(([thisUnitName, unitConfig]) => {
    const thisUnit = thisUnits[thisUnitName]

    const recurse = (nameObject, data, action) => {
      Object.entries(nameObject).forEach(([name, childNameObject]) => {
        const childData = action(name, data)
        if (childNameObject) recurse(childNameObject, childData, action)
      })
    }

    if (unitConfig.share) {
      const action = (name, { parent }) => {
        const inProperty = defineInProperty({ name, propertyType: "share", parent, thisUnit })
        return { parent: inProperty }
      }
      recurse(unitConfig.share, { parent: thisUnit }, action)
    }

    // This one's a bit tricky, the parent of the inProperties are outUnits. It makes sense if you
    // think about it.
    if (unitConfig.manage) {
      const action = (name, { isOneLevelDeep, parent }) => {
        if (isOneLevelDeep) {
          const outUnit = thisUnit.subproperties[name]
          return { isOneLevelDeep: false, parent: outUnit }
        }
        const inProperty = defineInProperty({ name, propertyType: "manage", parent, thisUnit })
        return { isOneLevelDeep: false, parent: inProperty }
      }
      recurse(unitConfig.manage, { isOneLevelDeep: true, parent: thisUnit }, action)
    }

    if (unitConfig.track) {
      const action = (name, { parent }) => {
        const inProperty = defineInProperty({ name, propertyType: "track", parent, thisUnit })
        return { parent: inProperty }
      }
      recurse(unitConfig.track, { parent: thisUnit }, action)
    }
  })

  /* OutProperties */
  Object.entries(unitDefinitions).forEach(([thisUnitName, unitConfig]) => {
    const thisUnit = thisUnits[thisUnitName]

    const recurse = (nameObject, data, action, postAction) => {
      Object.entries(nameObject).forEach(([name, childNameObject]) => {
        const childData = action(name, data)
        if (childNameObject) recurse(childNameObject, childData, action)
        if (postAction) postAction(name, data, childData)
      })
    }

    if (unitConfig.watch) {
      const action = (name, { isOneLevelDeep, parent, outUnit }) => {
        if (isOneLevelDeep) {
          const outUnit = thisUnit.subproperties[name]
          return { isOneLevelDeep: false, parent: outUnit, outUnit }
        }
        const outProperty = defineOutProperty({
          name,
          propertyType: "watch",
          parent,
          thisUnit,
          outUnit,
        })
        return { isOneLevelDeep: false, parent: outProperty, outUnit: outUnit }
      }
      const postAction = (name, { isOneLevelDeep }, { outUnit }) => {
        if (isOneLevelDeep) {
          thisUnit.scope[name] = getAnyOutValue(outUnit)
        }
      }
      recurse(
        unitConfig.watch,
        { isOneLevelDeep: true, parent: null, outUnit: null },
        action,
        postAction
      )
    }
    if (unitConfig.receive) {
      const action = (name, { parent }) => {
        const outProperty = defineOutProperty({ name, propertyType: "receive", parent, thisUnit })
        return { parent: outProperty }
      }
      recurse(unitConfig.receive, { parent: null }, action)
    }
  })

  /* thisUnit methods */
  Object.values(thisUnits).forEach(thisUnit => {
    thisUnit.handleChanges = ({ isWindowScoped, renderQueue = mainRenderQueue }) => {
      const action = (inProperty, value) => {
        inProperty.lastValue = inProperty.value
        inProperty.value = value
        if (inProperty.value !== inProperty.lastValue) {
          inProperty.outProperties.forEach(outProperty => {
            if (outProperty.isInRootOfScope) {
              outProperty.thisUnit.scope[outProperty.name] = getAnyOutValue(outProperty, value)
            }
            renderQueue.add(outProperty.thisUnit)
          })
        }
      }

      const recurse = ({ thisUnit, parent, parentValue }) => {
        Object.values(parent.subproperties).forEach(anyNamed => {
          if (anyNamed.isInProperty) {
            if (thisUnit.name === "videoPlayer" && anyNamed.name === "content") debugger
            const inProperty = anyNamed
            let value = (() => {
              if (parent === thisUnit) {
                if (isWindowScoped) {
                  return window[inProperty.name]
                } else {
                  return thisUnit.scope[inProperty.name]
                }
              } else {
                return parentValue?.[inProperty.name]
              }
            })()

            // Allows a unit to share one of its outProperties
            let fixedValue = (() => {
              if (isAnyOutValue(value)) {
                const anyOut = getAnyOutFromValue(value)
                if (anyOut.isOutUnit) {
                  throw new Error("Not yet implemented")
                }
                return anyOut.inProperty.value
              }
              return value
            })()

            action(inProperty, fixedValue)
            recurse({ thisUnit, parent: inProperty, parentValue: fixedValue })
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
      await callback()
      const dedicatedRenderQueue = RenderQueue()
      thisUnit.handleChanges({ isWindowScoped: false, renderQueue: dedicatedRenderQueue })
      if (dedicatedRenderQueue.isStopped()) {
        return new Promise(resolve => {
          dedicatedRenderQueue.onEmpty(resolve)
        })
      }
    }

    thisUnit.stop = async callback => {
      thisUnit.stopCount += 1
      const promise = callback()
      mainRenderQueue.stop(promise)
      await promise
      thisUnit.stopCount -= 1
      thisUnit.handleChanges({ isWindowScoped: false })
    }
  })
}
