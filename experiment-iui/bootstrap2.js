const metadata = () => {} // TODO

/* prettier-ignore */
const compiled = (
  ["statements",
    ["assign",
      ["name", "greet"],
      ["function",
        ["parameters", ["name", "nameString"]],
        ["statements",
          ["call",
            ["read", ["name", "console"], ["name", "log"]],
            ["arguments",
              ["string", ["stringText", "hello, "], ["stringReplacement", ["name", "nameString"]]],
            ],
          ],
        ]
      ],
    ],
    ["call", ["name", "greet"], ["arguments", ["string", ["stringText", "Philonius"]]]]
  ]
)
console.log(compiled)

// const compiled = ["add", ["number", 1], ["number", 1]]

const scopeVars = {
  console,
}

const core = {
  name: nameString => {
    return {
      nameString,
      get: () => scopeVars[nameString],
      createForAssignment: () => nameString,
    }
  },
  read: (node1, node2) => {
    const name1 = execute(node1)
    const name2 = execute(node2)
    return scopeVars[name1.nameString][name2.nameString]
  },
  add: (node1, node2) => {
    const result1 = execute(node1)
    const result2 = execute(node2)
    return result1 + result2
  },
  number: numberValue => {
    return numberValue
  },
  function: (parametersNode, statementsNode) => {
    return args => {
      execute(["parameters", args, ...parametersNode.slice(1)])
      execute(statementsNode)
    }
  },
  parameters: (args, ...nodes) => {
    nodes.forEach((node, index) => {
      execute(["assign", node, ["rawValue", args[index]]])
    })
  },
  statements: (...nodes) => {
    nodes.forEach(node => {
      execute(node)
    })
  },
  call: (nameNode, argumentsNode) => {
    const args = execute(argumentsNode)
    const functionValue = execute(nameNode)
    let functionCallable
    if (functionValue.nameString) {
      functionCallable = functionValue.get()
    } else {
      functionCallable = functionValue
    }
    functionCallable(args)
  },
  arguments: (...nodes) => {
    const results = nodes.map(node => execute(node))
    return results
  },
  assign: (node1, node2) => {
    const name = execute(node1)
    value = execute(node2)

    scopeVars[name.nameString] = value
    return value
  },
  rawValue: arbitraryData => {
    return arbitraryData
  },
  string: (...nodes) => {
    let output = ""
    nodes.forEach(node => {
      if (node[0] === "stringText") {
        output += node[1]
      } else if (node[0] === "stringReplacement") {
        const name = execute(node[1])
        output += name.get()
      }
    })
    return output
  },
}

const execute = node => {
  const coreFunction = core[node[0]]
  if (!coreFunction) throw new Error(`Invalid Syntax at ${node[0]}`)
  return coreFunction(...node.slice(1))
}

const startTime = performance.now()
const result = execute(compiled)
const endTime = performance.now()
console.log(result)
console.log(`Execution time: ${endTime - startTime}ms`)

// const scopeVars = {
//   console,
// }

// const bootstrapCompiled = (node) => {
//   const bootstrapName =

//   const bootstrapRead = (node1, node2) => {
//     const name1 = execute(node1)
//     const name2 = execute(node2)
//     return scopeVars[name1.nameString][name2.nameString]
//   }

//   const bootstrapAssign = (node1, node2) => {
//     const name = execute(node1)
//     scopeVars[name.nameString] = execute(node2)
//   }

//   // const bootstrapFunction = (parametersNode, statementsNode) => {
//   //   return (args) => {

//   //     scopeVars
//   //   }
//   // }

//   const execute = (node) => {
//     if (node[0] == 'bootstrapName') bootstrapName(node.slice(1))
//     if (node[0] == 'bootstrapRead') bootstrapRead(node.slice(1))
//     if (node[0] == 'bootstrapAssign') bootstrapAssign(node.slice(1))
//     if (node[0] == )
//   }

//   recurse(node)
// }
