const core = {}

const bootstrap = {}

bootstrap.variable = id => nameString => globalThis[nameString]

bootstrap.string = id => text => text

bootstrap.assign = id => (node1, node2) => {
  const result1 = node1()
  result1 = node2()
  return result1
}

bootstrap.read = id => (node1, node2) => {
  return node1()[node2()]
}

bootstrap.function = id => callbackNode => {
  return async args => {
    // Core will now be available
    return core.function(id)(callbackNode)(args)
  }
}

bootstrap.parameters = async args => {
  // Core will now be available
  return async (metadata, ...contents) => core.parameters(args)(metadata, ...contents)
}

bootstrap.body = async (metadata, ...statements) => {
  // Core will now be available
  return core.body(metadata, ...statements)
}
