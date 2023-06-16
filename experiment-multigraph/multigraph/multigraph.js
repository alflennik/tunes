const fs = require("fs/promises")
const path = require("path")

/*
;(async () => {
  const filePath = path.resolve(__dirname, "./multigraph.gg")
  const code = await fs.readFile(filePath, { encoding: "utf8" })

  const separatorCharacters = [" ", "\n", ","]

  let blocks = {}

  let currentWord
  let lastWord

  const parenStack = []

  const startWord = (character, location) => {
    currentWord = { name: character, nameStart: location, nameEnd: undefined }

    const parentLocation = parenStack[parenStack.length - 1]?.wordLocation
    if (parentLocation) {
      currentWord.parentLocation = parentLocation
    }
  }

  const addToWord = character => {
    currentWord.name += character
  }

  const saveWord = location => {
    currentWord.nameEnd = location
    blocks[currentWord.nameStart] = currentWord
    lastWord = currentWord
    currentWord = null
  }

  const startParen = ({ character, location, wordLocation }) => {
    parenStack.push({ character, location, wordLocation })
  }

  const saveParen = ({ parenType, parenEnd }) => {
    const currentParen = parenStack.pop()
    if (currentParen?.character !== "{") {
      throw new Error(`Mismatched parentheses at ${location}`)
    }
    blocks[currentParen.wordLocation] = {
      ...blocks[currentParen.wordLocation],
      parenType,
      parenStart: currentParen.location,
      parenEnd,
    }
  }

  let line = 1
  let column = 1

  for (let i = 0; i < code.length; i += 1) {
    const character = code[i]
    const location = `${line}:${column}`

    if (separatorCharacters.includes(character)) {
      if (currentWord) {
        saveWord(location)
      }
    }
    if (!currentWord && character.match(/[a-z]/)) {
      // words should start with a lowercase letter
      startWord(character, location)
    } else if (currentWord && character.match(/[a-zA-Z0-9]/)) {
      // After that any letter or number, no underscores or shit like that
      addToWord(character)
    } else if (currentWord) {
      throw new Error(`Invalid word ${currentWord.name} at ${location}`)
    }

    if (character === "{") {
      startParen({ character, location, wordLocation: lastWord.nameStart })
    }
    if (character === "}") {
      saveParen({ parenType: "{}", parenEnd: location })
    }

    if (character === "\n") {
      line += 1
      column = 1
    } else {
      column += 1
    }
  }
  console.log(blocks)
  console.log()
})()
*/

;(async () => {
  const filePath = path.resolve(__dirname, "./audioDescription.gg")
  const code = await fs.readFile(filePath, { encoding: "utf8" })

  let i = 0

  let line = 1
  let column = 1

  const goToNextCharacter = () => {
    if (code[i] === undefined) {
      throw new Error("No next character")
    }
    if (code[i] === "\n") {
      line += 1
      column = 1
    } else {
      column += 1
    }
    i += 1
  }

  const getName = () => {
    let name

    if (code[i].match(/[a-z]/)) {
      name = code[i]
      goToNextCharacter()
    } else {
      throw new Error("Invalid name")
    }

    while (true) {
      if (code[i].match(/[a-zA-Z0-9]/)) {
        name += code[i]
        goToNextCharacter()
      } else {
        break
      }
    }

    return { name }
  }

  const getWhiteSpace = () => {
    let includesNewlines = false
    let whiteSpace = ""

    while (true) {
      if (code[i] === " " || code[i] === "\t") {
        whiteSpace += code[i]
        goToNextCharacter()
      } else if (code[i] === "\n") {
        includesNewlines = true
        whiteSpace += code[i]
        goToNextCharacter()
      } else {
        break
      }
    }

    if (whiteSpace.length === 0) {
      throw new Error("Invalid syntax")
    }

    return { whiteSpace, includesNewlines }
  }

  const getOptionalWhiteSpace = () => {
    try {
      return getWhiteSpace()
    } catch {
      return { whiteSpace: "", includesNewlines: false }
    }
  }

  let getBlocks

  const getBlock = () => {
    const location = `"${line}:${column}"`

    const { name } = getName()

    getOptionalWhiteSpace()

    let hasOpenBrace = false
    let blocks
    if (code[i] === "{") {
      hasOpenBrace = true
      goToNextCharacter()
      getOptionalWhiteSpace()
      if (code[i] !== "}") {
        ;({ blocks } = getBlocks())
      }
    }
    if (code[i] === "}") {
      if (hasOpenBrace) goToNextCharacter()
    } else if (code[i] !== ",") {
      throw new Error("Unexpected character")
    }

    const { includesNewlines } = getOptionalWhiteSpace()

    let block
    if (blocks) {
      block = `block("${name}").sourceMap(${location}).items(${blocks})`
    } else {
      block = `blockEnd("${name}").sourceMap(${location})`
    }
    return { block, includesNewlines }
  }

  getBlocks = () => {
    let blocks = []

    while (true) {
      const { block, includesNewlines } = getBlock()
      blocks.push(block)

      if (code[i] === ",") {
        goToNextCharacter()
        getOptionalWhiteSpace()
        continue
      }
      if (code[i] === "}") {
        break
      }
      if (includesNewlines) {
        continue
      }
      throw new Error("Unexpected character")
    }

    return { blocks: blocks.join(",") }
  }

  getOptionalWhiteSpace()
  const { block: blockContent } = getBlock()
  const contents = `export default ({ block, blockEnd }) => ${blockContent}`

  const compiledFilePath = path.resolve(__dirname, "./audioDescription.intermediate.mjs")
  try {
    await fs.unlink(compiledFilePath)
  } catch {}
  await fs.writeFile(compiledFilePath, contents)

  const { default: audioDescription } = await import(compiledFilePath)

  const block = name => {
    let location
    const sourceMap = sourceMapLocation => {
      location = sourceMapLocation
      const items = (...allItems) => {
        allItems.forEach(item => console.log(item.name, item.location))
        return { name, location, items: allItems }
      }
      return { items }
    }
    return { sourceMap }
  }

  const blockEnd = name => {
    let location
    const sourceMap = sourceMapLocation => {
      location = sourceMapLocation
      return { name, location }
    }
    return { sourceMap }
  }

  audioDescription({ block, blockEnd })
  console.log()
})()

const statements = {
  "if <expression> { <statements> }": {},
  "if <expression> { <statements> }<repeatingStart> else if <expression> { <statements> }<repeatingEnd>":
    {},
  "if <expression> { <statements> }<repeatingStart> else if <expression> { <statements> }<repeatingEnd> else { <statements> }":
    {},
  "set <name, destructure> = <expression>": {},
  "set <name, destructure> ({ <statements> })": {},
  "reset <name, destructure> = <expression>": {},
  "reset <name, destructure> ({ <statements> })": {},
  "unset <name> {( <statements> })": {},
  "(<gapOk><destructure> = <expression><gapOk>)": {},
  "(<gapOk><destructure> = (<gapOk>{ <statements> }<gapOk>)<gapOk>)": {},
  "given <expression> { <whenStatements> }": {},
  "update { <statements> }": {},
  // "<name> { <blockItems> }": {},
  "return <expression>": {},
  "return <returnModifiers><expression>": {},
}
const expressions = {
  "<name>": {},
  "<number>": {},
  "(<gapOk><expression><gapOk>)": {},
  "<expression> + <expression>": {},
  "<expression> - <expression>": {},
  "<expression> * <expression>": {},
  "<expression> / <expression>": {},
  "<expression> += <expression>": {},
  "<expression> -= <expression>": {},
  "<expression> == <expression>": {},
  "<expression> != <expression>": {},
  "<expression> && <expression>": {},
  "<expression> || <expression>": {},
  "<expression> ?? <expression>": {},
  "<expression> \\>= <expression>": {},
  "<expression> \\<= <expression>": {},
  "<expression> \\< <expression>": {},
  "<expression> \\> <expression>": {},
  "<name> =\\> <expression>": {},
  "(<parameters>) =\\> <expression>": {},
  "(<parameters>) =\\> { <statements> }": {},
  "<expressionStart>!<expression>": {},
  "<expressionStart>!!<expression>": {},
  "<expressionStart>.<name>": {},
  "<expressionStart>{ <blockItems> }": {},
  "<name>[<expression>]": {},
  "<name>[<expression>,<gapOk><expression>]": {},
  "<name>?.[<expression>]": {},
  "<name>?.[<expression>,<gapOk><expression>]": {},
  "<name><gapOk>.<name>": {},
  "<name><gapOk>?.<name>": {},
  "<name>(<gapOk><arguments><gapOk>)": {},
  "<name>?.(<gapOk><arguments><gapOk>)": {},
}
