import { fpFromDecimal } from "@hastom/fixed-point"

const officialPrecision = 18 // largest possible number is 999 quadrillion

// Enables some digits of rounding, so 1/3 + 1/3 + 1/3 = 1 instead of 0.9999999
const extraDigitsOfHiddenPrecision = 4

const internalPrecision = officialPrecision + extraDigitsOfHiddenPrecision

const toString = ({ value, type }) => {
  if (type === "number") {
    const removeTrailingZeros = str => {
      return str.replace(/(^[0-9]+\..*?)(0+$)/, "$1").replace(/\.$/, "")
    }

    const roundOffPrecisionDigits = fixedPointNumber => {
      const digitsOfOfficialPrecision = fpFromDecimal(
        `1${"0".repeat(officialPrecision - 1)}`,
        internalPrecision
      )
      return fixedPointNumber.mul(digitsOfOfficialPrecision).round().div(digitsOfOfficialPrecision)
    }

    const hidePrecisionDigits = str => {
      return str.slice(0, -extraDigitsOfHiddenPrecision)
    }

    return removeTrailingZeros(
      hidePrecisionDigits(roundOffPrecisionDigits(value).toDecimalString())
    )
  }
}

const createRuntimeContainer = (value, type) => {
  return { value, type }
}

const createScope = () => {
  const variables = new Map()

  const set = (variable, result) => {
    variables.set(variable, result)
  }

  const memoryDump = () => {
    Array.from(variables.entries()).map(([{ value: memoryName }, { value, type }]) => {
      console.log(`${memoryName} = ${toString({ value, type })}`)
    })
  }

  return { set, memoryDump }
}

const scope = createScope()

const name = name => {
  return createRuntimeContainer(name, "name")
}

const number = number => {
  return createRuntimeContainer(fpFromDecimal(number, internalPrecision), "number")
}

const assign = (expression1, expression2) => {
  scope.set(evaluateExpression(expression1), evaluateExpression(expression2))
}

const add = (expression1, expression2) => {
  const runtimeContainer1 = evaluateExpression(expression1)
  const runtimeContainer2 = evaluateExpression(expression2)

  if (runtimeContainer1.type !== "number") {
    throw new Error(`Attempted to add a non-number, ${toString(runtimeContainer1)}`)
  } else if (runtimeContainer2.type !== "number") {
    throw new Error(`Attempted to add a non-number, ${toString(runtimeContainer2)}`)
  }

  return createRuntimeContainer(runtimeContainer1.value.add(runtimeContainer2.value), "number")
}

const divide = (expression1, expression2) => {
  const runtimeContainer1 = evaluateExpression(expression1)
  const runtimeContainer2 = evaluateExpression(expression2)

  if (runtimeContainer1.type !== "number") {
    throw new Error(`Attempted to divide a non number, ${toString(runtimeContainer1)}`)
  } else if (runtimeContainer2.type !== "number") {
    throw new Error(`Attempted to divide a non number, ${toString(runtimeContainer2)}`)
  }

  if (runtimeContainer2.value.eq(fpFromDecimal("0", internalPrecision))) {
    throw new Error(`Attempted to divide by zero`)
  }

  return createRuntimeContainer(runtimeContainer1.value.div(runtimeContainer2.value), "number")
}

const evaluateExpression = expression => {
  if (expression[0] === "name") return name(expression[1])
  if (expression[0] === "number") return number(expression[1])
  if (expression[0] === "add") return add(expression[1][0], expression[1][1])
  if (expression[0] === "divide") return divide(expression[1][0], expression[1][1])
}

const evaluateStatements = statements => {
  statements.forEach(statement => {
    if (statement[0] === "assign") assign(statement[1][0], statement[1][1])
  })
}

const evaluateShorthand = shorthand => {
  const miniAst = eval(`
    const program = (...statements) => [...statements]
    const assign = (expression1, expression2) => ["assign", [expression1, expression2]]
    const name = expression1 => ["name", expression1]
    const number = expression1 => ["number", expression1]
    const add = (expression1, expression2) => ["add", [expression1, expression2]]
    const divide = (expression1, expression2) => ["divide", [expression1, expression2]]
    ${shorthand}
  `)

  evaluateStatements(miniAst)
}

evaluateShorthand(
  `
    program(
      assign(name("someNumber"), add(
        divide(number("1"), number("3")),
        divide(number("2"), number("3")))))
  `
)

scope.memoryDump()
