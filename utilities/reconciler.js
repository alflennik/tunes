import { tagNameWeakMap } from "./define.js"
import getSemaphore from "./semaphore.js"

const propertiesWeakMap = new WeakMap()
const oldVirtualTreeWeakMap = new WeakMap()

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

  propertiesWeakMap.set(builder, elementProperties)

  return builder
}

export const component = (Component) => {
  const tagName = tagNameWeakMap.get(Component)
  const builder = element(tagName)

  const elementProperties = propertiesWeakMap.get(builder)

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

  propertiesWeakMap.set(builder, elementProperties)

  return builder
}

const createElement = (virtualElement) => {
  const {
    tagName,
    attributes,
    referenceHolder,
    referenceName,
    bindings,
    listeners,
    styles,
    bindingParent,
  } = virtualElement.properties

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

const updateElement = (virtualElement) => {
  const element = virtualElement.getElement()
  const { attributes, bindings, styles } = virtualElement.properties

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

const getVirtualTree = (component, builder) => {
  const getVirtualElement = ({ id, siblingIndex, properties, parentVirtualElement }) => {
    let element
    let children = []
    return {
      id,
      properties,
      getChildren: () => children,
      getFirstChild: () => children[0],
      getElement: () => element,
      getParent: () => parentVirtualElement,
      getParentElement: () => parentVirtualElement.getElement(),
      getPreviousSibling: () => {
        const parentChildren = parentVirtualElement.getChildren()
        return parentChildren[siblingIndex - 1] ?? null
      },
      getPreviousSiblingElement: () => {
        const parentChildren = parentVirtualElement.getChildren()
        return parentChildren[siblingIndex - 1]?.getElement() ?? null
      },
      getNextSibling: () => {
        const parentChildren = parentVirtualElement.getChildren()
        return parentChildren[siblingIndex + 1] ?? null
      },
      getNextSiblingElement: () => {
        const parentChildren = parentVirtualElement.getChildren()
        return parentChildren[siblingIndex + 1]?.getElement() ?? null
      },
      associateElement: (newElement) => {
        element = newElement
      },
      append: (child) => {
        children.push(child)
      },
    }
  }
  const getRootElement = () => {
    let children = []
    return {
      id: null,
      properties: null,
      getChildren: () => children,
      getFirstChild: () => children[0],
      getElement: () => component,
      getParent: () => {
        throw new Error("Unexpected")
      },
      getParentElement: () => {
        throw new Error("Unexpected")
      },
      getNextSibling: () => null,
      getNextSiblingElement: () => null,
      getPreviousSibling: () => null,
      getPreviousSiblingElement: () => null,
      append: (child) => {
        children.push(child)
      },
    }
  }

  const getId = ({ parentId, reconcilerId, positionIdIndex }) => {
    if (reconcilerId) return reconcilerId
    if (parentId === null) {
      return `${positionIdIndex}`
    } else if (parentId.match(/[0-9]$/)) {
      return `${parentId},${positionIdIndex}`
    } else {
      return `${parentId}:${positionIdIndex}`
    }
  }

  const virtualElementsById = {}

  const recurseBuilders = ({
    parentVirtualElement,
    parentId,
    siblingIndex = 0,
    positionIdIndex = 0,
    builders,
  }) => {
    builders.forEach((builder) => {
      if (builder === null) return

      const properties = propertiesWeakMap.get(builder)

      if (properties.isFragment) {
        recurseBuilders({
          parentVirtualElement,
          parentId,
          siblingIndex,
          positionIdIndex,
          builders: properties.childBuilders,
        })
        return
      }

      const id = getId({ parentId, positionIdIndex, reconcilerId: properties.reconcilerId })

      const virtualElement = getVirtualElement({
        id,
        siblingIndex,
        properties,
        parentVirtualElement,
      })

      virtualElementsById[id] = virtualElement

      siblingIndex += 1
      if (!properties.reconcilerId) {
        positionIdIndex += 1
      }

      parentVirtualElement.append(virtualElement)

      if (properties.childBuilders) {
        recurseBuilders({
          parentVirtualElement: virtualElement,
          parentId: id,
          builders: properties.childBuilders,
        })
      }
    })
  }

  const rootElement = getRootElement()

  recurseBuilders({
    parentVirtualElement: rootElement,
    parentId: null,
    builders: [builder],
  })

  const getIterator = () => {
    const hasNoContent = rootElement.getChildren().length === 0

    let backlog = []
    let current = rootElement
    let isDone = hasNoContent

    return {
      next: () => {
        if (current.getFirstChild()) {
          backlog.push(current.getFirstChild)
        }
        if (current.getNextSibling()) {
          current = current.getNextSibling()
          return current
        }
        if (backlog[0]) {
          current = backlog.shift()()
          if (!current.getNextSibling() && !current.getFirstChild() && !backlog[0]) {
            isDone = true
          }
          return current
        }
      },
      isDone: () => isDone,
    }
  }

  const iterator = getIterator()

  return {
    isDone: iterator.isDone,
    next: iterator.next,
    getById: (id) => {
      return virtualElementsById[id]
    },
    getDiscardedElements: (compareVirtualTree) => {
      const discardedElements = []
      Object.entries(virtualElementsById).forEach(([id, virtualElement]) => {
        if (!compareVirtualTree.getById(id) && virtualElement.properties.reconcilerId) {
          discardedElements.push(virtualElement.getElement())
        }
      })
      return discardedElements
    },
  }
}

const reconcile = (component, getBuilder) => {
  const builder = getBuilder()

  const virtualTree = getVirtualTree(component, builder)
  const oldVirtualTree = oldVirtualTreeWeakMap.get(component)

  const discardedElements = oldVirtualTree?.getDiscardedElements(virtualTree) ?? []
  discardedElements.forEach((discardedElement) => {
    discardedElement.remove()
  })

  while (true) {
    if (virtualTree.isDone()) break

    const virtualElement = virtualTree.next()

    const oldVirtualElement = oldVirtualTree?.getById(virtualElement.id)

    if (oldVirtualElement) {
      const element = oldVirtualElement.getElement()

      virtualElement.associateElement(element)

      const parentElement = virtualElement.getParentElement()

      if (virtualElement.properties.text != null) {
        parentElement.innerText = virtualElement.properties.text
      } else {
        updateElement(virtualElement)
      }

      // Move element if it is in the wrong place
      const oldParentElement = oldVirtualElement.getParentElement()
      const previousElement = virtualElement.getPreviousSiblingElement()
      const oldPreviousElement = oldVirtualElement.getPreviousSiblingElement()
      if (
        virtualElement.properties.reconcilerId &&
        (parentElement !== oldParentElement || previousElement !== oldPreviousElement)
      ) {
        const previousElement = virtualElement.getPreviousSiblingElement()
        if (previousElement) {
          previousElement.insertAdjacentElement("afterend", element)
        } else {
          parentElement.insertAdjacentElement("afterbegin", element)
        }
      }
    } else {
      const parentElement = virtualElement.getParentElement()

      if (virtualElement.properties.text) {
        parentElement.innerText = virtualElement.properties.text
      } else {
        const element = createElement(virtualElement)

        const previousElement = virtualElement.getPreviousSiblingElement()

        virtualElement.associateElement(element)

        if (previousElement) {
          previousElement.insertAdjacentElement("afterend", element)
        } else {
          parentElement.insertAdjacentElement("afterbegin", element)
        }
      }
    }
  }

  oldVirtualTreeWeakMap.set(component, virtualTree)
}

export const build = (component, getBuilder, { onComplete }) => {
  buildSemaphore(() => {
    reconcile(component, getBuilder)
    onComplete()
  })
}

utilities.convertAnyRawStringsToTextBuilders = (childBuilders) => {
  return childBuilders.map((builderOrString) => {
    if (typeof builderOrString !== "string") return builderOrString

    const builder = {}

    let elementProperties = { text: builderOrString }

    propertiesWeakMap.set(builder, elementProperties)

    return builder
  })
}
