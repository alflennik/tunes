import { tagNameWeakMap } from "./define.js"
import getSemaphore from "./semaphore.js"

const getElementPropertiesWeapMap = new WeakMap()
const peviousBuilderWeakMap = new WeakMap()

const utilities = {}

let buildContext

const buildSemaphore = getSemaphore()

export const element = (tagName) => {
  let elementProperties = {}

  elementProperties.tagName = tagName

  const builder = {}

  builder.children = (...childBuilders) => {
    elementProperties.childBuilders = utilities.convertAnyRawStringsToTextBuilders(childBuilders)
    return builder
  }

  builder.key = (key) => {
    elementProperties.key = key
    return builder
  }

  builder.attributes = (attributes) => {
    elementProperties.attributes = attributes
    return builder
  }

  builder.reference = (referenceHolder, referenceName) => {
    elementProperties.referenceHolder = referenceHolder
    elementProperties.referenceName = referenceName
    return builder
  }

  builder.listeners = (eventName, eventHandler) => {
    elementProperties.eventName = eventName
    elementProperties.eventHandler = eventHandler
    return builder
  }

  getElementPropertiesWeapMap.set(builder, () => elementProperties)

  return builder
}

export const component = (Component) => {
  const tagName = tagNameWeakMap.get(Component)
  const builder = element(tagName)

  const getElementProperties = getElementPropertiesWeapMap.get(builder)
  const elementProperties = getElementProperties()

  builder.bindings = (bindings) => {
    elementProperties.bindings = bindings
    return builder
  }

  elementProperties.bindingParent = buildContext.bindingParent

  return builder
}

export const fragment = (...childBuilders) => {
  const builder = {}

  const elementProperties = {
    isFragment: true,
    childBuilders: utilities.convertAnyRawStringsToTextBuilders(childBuilders),
  }

  getElementPropertiesWeapMap.set(builder, () => elementProperties)

  return builder
}

const buildElement = (elementProperties) => {
  const {
    tagName,
    attributes,
    referenceHolder,
    referenceName,
    bindings,
    eventName,
    eventHandler,
    bindingParent,
  } = elementProperties

  const element = document.createElement(tagName)

  if (attributes) {
    Object.entries(attributes).forEach(([attributeName, attributeValue]) => {
      if (attributeValue === undefined) {
        element.removeAttribute(attributeName)
      } else {
        element.setAttribute(attributeName, attributeValue)
      }
    })
  }

  if (referenceHolder && referenceName) {
    referenceHolder[referenceName] = element
  }

  if (eventName && eventHandler) {
    element.addEventListener(eventName, eventHandler)
  }

  if (bindings) {
    element.setBindings(bindings)
  }

  if (bindingParent) {
    element.bindingParent = bindingParent
  }

  return element
}

const updateElement = (element, elementProperties) => {
  const { attributes, bindings } = elementProperties

  if (attributes) {
    Object.entries(attributes).forEach(([attributeName, attributeValue]) => {
      if (attributeValue === undefined) {
        element.removeAttribute(attributeName)
      } else {
        element.setAttribute(attributeName, attributeValue)
      }
    })
  }

  if (bindings) {
    element.setBindings(bindings)
  }

  return element
}

/*
const debugBuilder = (component, builder) => {
  let refs = {}
  const getId = () => Math.random().toString().substr(2, 5)
  console.log(
    JSON.stringify(
      {
        [component.tagName.toLowerCase()]: (() => {
          const recurse = (builders) => {
            return builders.map((childBuilder) => {
              const getElementProperties = getElementPropertiesWeapMap.get(childBuilder)
              const elementProperties = getElementProperties()

              const output = {}
              if (elementProperties.tagName) {
                output.tagName = elementProperties.tagName
              }
              if (elementProperties.isFragment) {
                output.isFragment = elementProperties.isFragment
              }
              if (elementProperties.text != null) {
                output.text = elementProperties.text
              }
              if (elementProperties.element && !elementProperties.isFragment) {
                const id = getId()
                refs[id] = elementProperties.element
                const elementNodeType = 1
                const textNodeType = 3
                if (elementProperties.element.nodeType === elementNodeType) {
                  output.element = `${elementProperties.element?.tagName.toLowerCase()} (${id})`
                } else if (elementProperties.element.nodeType === textNodeType) {
                  output.textNode = `textNode (${id})`
                }
              }

              if (elementProperties.childBuilders) {
                output.children = recurse(elementProperties.childBuilders)
              }

              return output
            })
          }
          return recurse([builder])
        })(),
      },
      null,
      2
    )
  )

  return refs
}
*/

const initialBuild = (component) => {
  const builder = component.reactiveTemplate()

  const recursivelyAppend = (parent, builders) => {
    if (!builders) return

    // Breadth-first recursion - complete siblings first
    builders.forEach((builder) => {
      const getElementProperties = getElementPropertiesWeapMap.get(builder)
      const elementProperties = getElementProperties()

      if (elementProperties.isFragment) return

      if (elementProperties.text) {
        parent.innerText = elementProperties.text
        return
      }

      const element = buildElement(elementProperties)
      elementProperties.element = element

      parent.appendChild(element)
    })

    // Breadth-first recursion - now that siblings are complete do the children
    builders.forEach((builder) => {
      const getElementProperties = getElementPropertiesWeapMap.get(builder)
      const elementProperties = getElementProperties()

      let element
      if (elementProperties.isFragment) {
        element = parent
      } else {
        element = elementProperties.element
      }

      const childBuilders = elementProperties.childBuilders

      recursivelyAppend(element, childBuilders)
    })
  }

  recursivelyAppend(component, [builder])

  peviousBuilderWeakMap.set(component, builder)
}

const secondaryBuild = (component) => {
  const builder = component.reactiveTemplate()
  const oldBuilder = peviousBuilderWeakMap.get(component)

  const recursivelyReconcile = (parent, builders, oldBuilders) => {
    if (!builders && !oldBuilders) return

    // Breadth-first recursion - complete siblings first
    builders.forEach((builder, index) => {
      const oldBuilder = oldBuilders[index]
      const getElementProperties = getElementPropertiesWeapMap.get(builder)
      const getOldElementProperties = getElementPropertiesWeapMap.get(oldBuilder)
      const elementProperties = getElementProperties()
      const oldElementProperties = getOldElementProperties()

      if (
        oldElementProperties.tagName !== elementProperties.tagName ||
        oldElementProperties.key !== elementProperties.key
      ) {
        throw new Error("Temporary error: failed to reconcile")
      }

      if (elementProperties.isFragment) return

      if (elementProperties.text != null) {
        parent.innerText = elementProperties.text
        return
      }

      const element = oldElementProperties.element
      elementProperties.element = element

      updateElement(element, elementProperties)
    })

    // Breadth-first recursion - now that siblings are complete do the children
    builders.forEach((builder, index) => {
      const oldBuilder = oldBuilders[index]
      const getElementProperties = getElementPropertiesWeapMap.get(builder)
      const getOldElementProperties = getElementPropertiesWeapMap.get(oldBuilder)
      const elementProperties = getElementProperties()
      const oldElementProperties = getOldElementProperties()

      let element
      if (elementProperties.isFragment) {
        element = parent
      } else {
        element = elementProperties.element
      }

      const childBuilders = elementProperties.childBuilders
      const oldChildBuilders = oldElementProperties.childBuilders

      recursivelyReconcile(element, childBuilders, oldChildBuilders)
    })
  }

  recursivelyReconcile(component, [builder], [oldBuilder])

  peviousBuilderWeakMap.set(component, builder)
}

export const build = (component) => {
  buildSemaphore(() => {
    buildContext = { bindingParent: component }

    const firstBuild = !peviousBuilderWeakMap.get(component)
    if (firstBuild) {
      initialBuild(component)
    } else {
      secondaryBuild(component)
    }
  })
}

utilities.convertAnyRawStringsToTextBuilders = (childBuilders) => {
  return childBuilders.map((builderOrString) => {
    if (typeof builderOrString !== "string") return builderOrString

    const builder = {}

    let elementProperties = { text: builderOrString }

    getElementPropertiesWeapMap.set(builder, () => elementProperties)

    return builder
  })
}
