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
        }
        index += 2
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
    matches.push(match)
  }

  matches.forEach(match => {
    globals.add(match[1])

    const start = match.index + match[0].length - 1
    const end = parenMap[start]
    const defineContentSuperset = text.slice(start, end)

    // Remove update part
    const updateMatch = defineContentSuperset.match(/update(First)?\s*:\s*\([^)]*\)\s*=>\s*{/)
    const updateParenStart = updateMatch.index + updateMatch[0].length - 1
    const updateStart = updateMatch.index
    const updateEnd = parenMap[start + updateParenStart] - start

    const defineContent =
      defineContentSuperset.slice(0, updateStart) + defineContentSuperset.slice(updateEnd)

    defineContent.match(/\w+/g).forEach(word => {
      if (["watch", "share", "manage", "receive", "track"].includes(word)) return
      globals.add(word)
    })
  })
}

export default {
  loadGraph: async ({ componentPaths }) => {
    let globals = new Set()

    await Promise.all(
      componentPaths.map(async componentPath => {
        const componentText = await fetch(componentPath).then(response => response.text())
        extractGlobals(componentText, globals)
      })
    )

    const wmIsProxy = new WeakMap()
    const isProxy = proxy => !!wmIsProxy.get(proxy)
    const identifyProxy = proxy => wmIsProxy.set(proxy, true)

    const wmProxyName = new WeakMap()
    const wmProxyMemory = new WeakMap()

    const dummyFunction = () => {}

    let activeScope = null

    const getFromActiveScope = name => ({
      apply: (target, receiver, args) => {
        if (!activeScope || !activeScope[name]) {
          throw new Error(`Cannot call ${name} in this scope`)
        }
        return activeScope[name](...args)
      },
      get: (target, property) => {
        if (!activeScope || !activeScope[name]) {
          throw new Error(`Cannot read ${name} in this scope`)
        }
        return activeScope[property]
      },
      set: () => {
        throw new Error("Not permitted")
      },
    })

    const keywords = [
      "justChanged",
      "stop",
      "set",
      "section",
      "render",
      "ripple",
      "reconcile",
      "element",
      "component",
      "justAttached",
      "manage",
      "content",
      "last",
    ]

    keywords.forEach(keyword => {
      window[keyword] = new Proxy(dummyFunction, getFromActiveScope(keyword))
      identifyProxy(window[keyword])
    })

    globals.forEach(name => {
      window[name] = new Proxy(dummyFunction, getFromActiveScope(name))
      identifyProxy(window[name])
      wmProxyName.set(window[name], name)
      window[`$${name}`] = null
    })

    let components = {}
    const stoppedComponents = {}

    // Used to tell the difference between genuinely not set and being set to undefined
    const notSet = {}

    window.define = nameObj => defineContent => {
      const componentName = Object.keys(nameObj)[0]
      components[componentName] = defineContent
    }

    await Promise.all(
      componentPaths.map(async componentPath => {
        await import(componentPath)
      })
    )

    const getType = value => {
      if (typeof value === "object") {
        if (Array.isArray(value)) return "array"
        if (value === null) return "null"
      }
      return typeof value
    }

    const canProxy = value => value !== null && typeof value === "object"

    const defineKeywords = ({ scope, memoryMap }) => {
      const unlock = proxy => {
        const name = wmProxyName.get(proxy)
        return memoryMap.get(scope[name])
      }

      const wmSetOnce = new WeakMap()
      const wmSetOnceValue = new WeakMap()
      const renderList = Object.fromEntries(
        Object.keys(components).map(componentName => [componentName, true])
      )

      scope.stop = async callback => {
        if (stoppedComponents[componentName]) throw new Error("Cannot stop component twice")
        stoppedComponents[componentName] = true
        await callback()
        delete stoppedComponents[componentName]
      }

      scope.set = (...proxies) => {
        const setValue = ({ memory, value }) => {
          const changed = memory.value !== notSet && memory.value !== value
          memory.lastValue = memory.value
          memory.value = value
          if (!canProxy(value) || (memory.lastValue !== notSet && !canProxy(memory.lastValue))) {
            if (memory.scopeName) {
              scope[memory.scopeName] = value
              scope[`$${memory.scopeName}`] = value
            }
          }
          memory.watches.forEach(watch => {
            watch.changed = true
            renderList[watch.componentName] = true
          })
        }

        return {
          by: callback => {
            const memory = unlock(proxy)
            const value = callback()
            setValue({ memory, value })
          },
          once: callback => {
            let overallValue

            if (wmSetOnce.get(proxies[0])) {
              overallValue = wmSetOnceValue.get(proxy)
            } else {
              wmSetOnce.set(proxies[0], true)
              overallValue = callback()
              wmSetOnceValue.set(proxies[0], value)
            }

            proxies.forEach(proxy => {
              const memory = unlock(proxy)
              if (proxies.length === 1) {
                setValue({ memory, value: overallValue })
              } else {
                setValue({ memory, value: overallValue[memory.name] })
              }
            })
          },
        }
      }

      scope.justChanged = (proxy, changedTo = notSet) => {
        const memory = unlock(proxy)
        const changed = memory.value !== memory.lastValue
        return changed && (changedTo === notSet || changedTo === memory.value)
      }

      const sections = {}
      scope.section = sectionName => {
        return {
          by: callback => {
            callback()
          },
          once: callback => {
            if (sections[sectionName] !== notSet) return sections[sectionName]
            sections[sectionName] = callback()
          },
        }
      }

      scope.render = proxy => {
        const memory = unlock(proxy)
        const component = components[memory.name]
        const update = component.updateFirst ?? component.update
        activeScope = component.scope
        update({ _: component.scope })
        activeScope = null
      }

      scope.ripple = () => {
        const firstKey = obj => {
          for (key in obj) {
            return key
          }
        }
        const renderCount = {}
        let componentName
        while ((componentName = firstKey(renderList))) {
          if (renderCount[componentName] === undefined) renderCount[componentName] = 0
          renderCount[componentName] += 1
          if (renderCount[componentName] > 4) {
            throw new Error(`Infinite loop detected while rendering ${componentName}`)
          }
          components[componentName].scope.render()
        }
      }

      scope.manage = () => {}
      scope.content = () => {}
      scope.equivalent = (a, b) => {
        if (isProxy(a) && isProxy(b)) {
          const aMemory = unlock(a)
          const bMemory = unlock(b)
          return aMemory.value === bMemory.value
        }
        return a === b
      }
      scope.last = () => {
        return new Proxy(
          {},
          {
            get: (target, property) => {
              const memory = getMemory(scope[property])
              return memory.lastValue
            },
          }
        )
      }

      scope.reconcile = () => {}
      scope.element = () => {}
      scope.component = () => {}
      scope.justAttached = () => {}
    }

    let updateFirst

    const wmIsArray = new WeakMap()
    const wmNoParent = new WeakMap()

    const wmShareWatch = new WeakMap()
    const wmWatchShare = new WeakMap()
    const wmShareChanged = new WeakMap()
    const receiveManage = new Map()
    const manageReceive = new Map()

    Object.entries(components).forEach(([componentName, defineContent]) => {
      if (defineContent.updateFirst) {
        if (updateFirst) throw new Error("Found multiple components trying to update first")
        updateFirst = components[componentName]
      }

      const scope = {}
      const memoryMap = new Map()

      const share = {}
      const recurseShare = ({ parent, obj, inArray }) => {
        Object.entries(obj).forEach(([name, value]) => {
          const memory = { type: "share" }
          const sharedItem = {}
          memoryMap.set(sharedItem, memory)

          if (!parent) share[name] = sharedItem

          // Handle name conflicts
          if (!parent) wmNoParent.set(sharedItem, true)
          const conflictDetected = !!scope[name]
          if (conflictDetected) {
            if (!wmNoParent.get(scope[name])) {
              // No ambiguous names except in the case that the name wouldn't be accessible any
              // other way
              scope[name] = undefined
            }
          } else if (!inArray) {
            scope[name] = sharedItem
          }

          if (Array.isArray(value)) {
            inArray = true
            wmIsArray.set(sharedItem, true)
            parent[name] = sharedItem
            recurseShare({ parent: sharedItem, obj: value[0], inArray })
          } else {
            if (parent) parent[name] = sharedItem
            if (!isProxy(value)) recurseShare({ parent: sharedItem, obj: value, inArray })
          }
        })
      }
      if (defineContent.share) {
        recurseShare({ parent: null, obj: defineContent.share, inArray: false })
      }

      defineKeywords({ scope, memoryMap })

      const manage = {}
      if (defineContent.manage) {
        Object.keys(defineContent.manage).forEach(name => {
          const memory = { type: "manage" }
          const managedItem = {}
          memoryMap.set(managedItem, memory)

          manage[name] = managedItem
          if (scope[name]) {
            if (wmNoParent.get(scope[name])) {
              throw new Error(`Ambiguous name ${name} in ${componentName}`)
            }
            scope[name] = undefined
          } else {
            scope[name] = managedItem
          }
        })
      }

      const track = {}
      if (defineContent.track) {
        Object.keys(defineContent.track).forEach(name => {
          const memory = { type: "track" }
          const trackedItem = {}
          memoryMap.set(trackedItem, memory)

          track[name] = trackedItem
          if (scope[name]) {
            if (wmNoParent.get(scope[name])) {
              throw new Error(`Ambiguous name ${name} in ${componentName}`)
            }
            scope[name] = undefined
          } else {
            scope[name] = trackedItem
          }
        })
      }

      components[componentName].scope = scope
      components[componentName].share = share
      components[componentName].manage = manage
      components[componentName].track = track

      // console.log(name)
    })

    // ({ update, updateFirst, watch, manage, content }) => {
    Object.entries(components).forEach(([componentName, defineContent]) => {
      const scope = components[componentName].scope

      const recurseWatch = ({ watchComponentName, obj, shareObj, inArray }) => {
        Object.entries(obj).forEach(([name, value]) => {
          const watchedItem = {}

          if (!shareObj[name]) {
            throw new Error(
              `Component ${componentName} expected ${name} to be shared by ${watchComponentName}.`
            )
          }

          wmShareWatch.set(shareObj[name], watchedItem)
          wmWatchShare.set(watchedItem, shareObj[name])

          // Handle name conflicts
          const conflictDetected = !!scope[name]
          if (conflictDetected) {
            if (!wmNoParent.get(scope[name])) {
              // No ambiguous names except in the case that the name wouldn't be accessible any
              // other way
              scope[name] = undefined
            }
          } else if (!inArray) {
            scope[name] = watchedItem
          }

          if (Array.isArray(value)) {
            inArray = true
            wmIsArray.set(watchedItem, true)
            if (!wmIsArray.get(shareObj[name])) {
              throw new Error(
                `Component ${componentName} expected ${name}, shared by ${watchComponentName}, ` +
                  `to be an array.`
              )
            }
            recurseWatch({ watchComponentName, obj: value[0], shareObj: shareObj[name], inArray })
          } else {
            if (!isProxy(value)) {
              recurseWatch({ watchComponentName, obj: value, shareObj: shareObj[name], inArray })
            }
          }
        })
      }
      if (defineContent.watch) {
        Object.entries(defineContent.watch).forEach(([watchComponentName, watchObj]) => {
          const shareObj = components[watchComponentName].share
          recurseWatch({ watchComponentName, obj: watchObj, shareObj, inArray: false })
        })
      }

      if (defineContent.receive) {
        const seekingManage = Object.fromEntries(
          Object.keys(defineContent.receive).map(key => [key, null])
        )
        Object.values(components).forEach(({ manage }) => {
          Object.entries(manage).forEach(([name, managed]) => {
            if (seekingManage[name] !== undefined) {
              if (seekingManage[name] !== null) {
                throw new Error(
                  `Component ${componentName} received multiple components attempting to manage ` +
                    `${name}`
                )
              }
              const receivedItem = {}
              seekingManage[name] = receivedItem
              receiveManage.set(receivedItem, managed)
              manageReceive.set(managed, receivedItem)

              const conflictDetected = !!scope[name]
              if (conflictDetected) {
                if (wmNoParent.get(scope[name])) {
                  throw new Error(`Ambiguous name ${name} in ${componentName}`)
                }
                scope[name] = undefined
              } else {
                scope[name] = receivedItem
              }
            }
          })
        })
      }
    })
  },
}
