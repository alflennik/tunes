import { tagNameWeakMap } from "./define.js"
import getSemaphore from "./semaphore.js"

const getElementPropertiesWeapMap = new WeakMap()
const getElementWeapMap = new WeakMap()
const getReconcilerIdElementPropertiesWeapMap = new WeakMap()
const peviousBuilderWeakMap = new WeakMap()

const utilities = {}

const buildSemaphore = getSemaphore()

export const element = (tagName) => {
  let elementProperties = {}

  elementProperties.tagName = tagName

  const builder = {}

  builder.children = (...childBuilders) => {
    elementProperties.childBuilders = utilities.convertAnyRawStringsToTextBuilders(childBuilders)
    return builder
  }

  builder.reconcilerId = (reconcilerId) => {
    if (reconcilerId === null || reconcilerId === undefined || typeof reconcilerId !== "string") {
      throw new Error("Found invalid reconcilerId")
    }
    elementProperties.reconcilerId = reconcilerId
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

  builder.listeners = (listeners) => {
    elementProperties.listeners = listeners
    return builder
  }

  builder.styles = (styles) => {
    elementProperties.styles = styles
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
    listeners,
    styles,
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

  if (listeners) {
    Object.entries(listeners).forEach(([eventName, eventHandler]) => {
      element.addEventListener(eventName, eventHandler)
    })
  }

  if (bindings) {
    element.setBindings(bindings)
  }

  if (styles) {
    Object.entries(styles).forEach(([styleName, styleValue]) => {
      if (styleName.startsWith("--")) {
        element.style.setProperty(styleName, styleValue)
      } else {
        element.style[styleName] = styleValue
      }
    })
  }

  if (bindingParent) {
    element.bindingParent = bindingParent
  }

  return element
}

const updateElement = (element, elementProperties) => {
  const { attributes, bindings, styles } = elementProperties

  if (attributes) {
    Object.entries(attributes).forEach(([attributeName, attributeValue]) => {
      if (attributeValue === undefined) {
        element.removeAttribute(attributeName)
      } else {
        element.setAttribute(attributeName, attributeValue)
      }
    })
  }

  if (styles) {
    Object.entries(styles).forEach(([styleName, styleValue]) => {
      if (styleName.startsWith("--")) {
        element.style.setProperty(styleName, styleValue)
      } else {
        element.style[styleName] = styleValue
      }
    })
  }

  if (bindings) {
    element.setBindings(bindings)
  }

  return element
}

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

const reconcile = (component) => {
  const builder = component.reactiveTemplate()
  const oldBuilder = peviousBuilderWeakMap.get(component)
  const isSecondaryBuild = !!oldBuilder

  const reconcilerIdElementProperties = {}
  let oldReconcilerIdElementProperties
  if (isSecondaryBuild) {
    oldReconcilerIdElementProperties = getReconcilerIdElementPropertiesWeapMap.get(oldBuilder)
  }

  const recursivelyReconcile = (parent, builders, oldBuilders) => {
    if (!builders) return

    // Breadth-first recursion - complete siblings first
    builders.forEach((builder, index) => {
      if (builder === null) return

      const getElementProperties = getElementPropertiesWeapMap.get(builder)
      const elementProperties = getElementProperties()

      if (elementProperties.reconcilerId) {
        reconcilerIdElementProperties[elementProperties.reconcilerId] = elementProperties
      }

      let oldElementProperties
      if (isSecondaryBuild) {
        if (elementProperties.reconcilerId) {
          oldElementProperties = oldReconcilerIdElementProperties[elementProperties.reconcilerId]
        } else {
          const oldBuilder = oldBuilders[index]
          const getOldElementProperties = getElementPropertiesWeapMap.get(oldBuilder)
          oldElementProperties = getOldElementProperties()
        }
      }

      if (elementProperties.isFragment) return

      if (elementProperties.text != null) {
        parent.innerText = elementProperties.text
        return
      }

      if (oldElementProperties) {
        const element = oldElementProperties.element
        updateElement(element, elementProperties)
        elementProperties.element = element
      } else {
        const element = buildElement(elementProperties)
        parent.appendChild(element)
        elementProperties.element = element
      }
    })

    // Breadth-first recursion - now that siblings are complete do the children
    builders.forEach((builder, index) => {
      if (builder === null) return

      const getElementProperties = getElementPropertiesWeapMap.get(builder)
      const elementProperties = getElementProperties()

      let oldElementProperties
      if (isSecondaryBuild) {
        if (elementProperties.reconcilerId) {
          oldElementProperties = oldReconcilerIdElementProperties[elementProperties.reconcilerId]
        } else {
          const oldBuilder = oldBuilders[index]
          const getOldElementProperties = getElementPropertiesWeapMap.get(oldBuilder)
          oldElementProperties = getOldElementProperties()
        }
      }

      let element
      if (elementProperties.isFragment) {
        element = parent
      } else {
        element = elementProperties.element
      }

      const childBuilders = elementProperties.childBuilders
      let oldChildBuilders
      if (oldElementProperties) {
        oldChildBuilders = oldElementProperties.childBuilders
      }

      recursivelyReconcile(element, childBuilders, oldChildBuilders)
    })
  }

  recursivelyReconcile(component, [builder], [oldBuilder])

  getReconcilerIdElementPropertiesWeapMap.set(builder, reconcilerIdElementProperties)
  peviousBuilderWeakMap.set(component, builder)
}

export const build = (component) => {
  return new Promise((resolve) => {
    buildSemaphore(() => {
      reconcile(component)
      resolve()
    })
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
