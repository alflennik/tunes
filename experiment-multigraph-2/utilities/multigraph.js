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
  const re = /\bdefine\s*\(\s*{\s*(\w+)\s*,?\s*}\s*\)\s*\(\s*\{/g
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
      if (["watch", "share", "manage", "receive", "content", "track"].includes(word)) return
      globals.add(word)
    })
  })
}

export default {
  loadGraph: async ({ componentPaths }) => {
    let globals = new Set()
    // const componentText = await fetch(componentPaths[5]).then(response => response.text())
    // debugger
    // extractGlobals(componentText, globals)

    await Promise.all(
      componentPaths.map(async componentPath => {
        const componentText = await fetch(componentPath).then(response => response.text())
        extractGlobals(componentText, globals)
      })
    )

    const locked = true

    globals.forEach(name => {
      const target = { name }
      const handler = {
        get: (target, property) => {
          if (!locked) return Reflect.get(target, property)
          throw new Error(`Could not read property "${property}"`)
        },
        set: () => {
          if (!locked) return Reflect.set(target, property)
          throw new Error("Not permitted")
        },
      }
      window[name] = new Proxy(target, handler)
      window[`$${name}`] = new Proxy(target, handler)
    })
    console.log(globals)

    window.define = nameObj => defineContent => {}
    window.justChanged = () => {}
    window.stop = () => {}
    window.set = () => {}
    window.section = () => {}
    window.render = () => {}
    window.ripple = () => {}
    window.reconcile = () => {}
    window.element = () => {}
    window.component = () => {}
    window.justAttached = () => {}
    window.manage = () => {}
    window.content = new Proxy({}, {})
    window.last = new Proxy({}, {})

    // multigraph.establishMultigraphProxies()

    await Promise.all(
      componentPaths.map(async componentPath => {
        await import(componentPath)
      })
    )
  },
}
