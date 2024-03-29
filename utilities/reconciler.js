import { reconcilerTools } from "./multigraph.js"

const propertiesWeakMap = new WeakMap()
const oldVirtualTreeWeakMap = new WeakMap()
const isReconcilerRootWeakMap = new WeakMap()

const getReconcilerRootElement = builder => {
  if (!reconcilerTools.isAnyOutValue(builder)) return false
  const value = (() => {
    const anyOut = reconcilerTools.getAnyOutFromValue(builder)
    if (!anyOut.isOutProperty) throw new Error("Not yet implemented")
    return anyOut.inProperty.value
  })()
  if (isReconcilerRootWeakMap.get(value)) {
    return value.element
  }
}

export const element = tagName => {
  let elementProperties = {}

  elementProperties.tagName = tagName

  const builder = {}

  builder.items = (...childBuilders) => {
    elementProperties.childBuilders = childBuilders
    return builder
  }

  builder.text = text => {
    elementProperties.text = text
    return builder
  }

  builder.reconcilerId = reconcilerId => {
    if (reconcilerId === null || reconcilerId === undefined || typeof reconcilerId !== "string") {
      throw new Error("Found invalid reconcilerId")
    }
    elementProperties.reconcilerId = reconcilerId
    return builder
  }

  builder.attributes = attributes => {
    elementProperties.attributes = attributes
    return builder
  }

  builder.reference = (referenceHolder, referenceName) => {
    elementProperties.referenceHolder = referenceHolder
    elementProperties.referenceName = referenceName
    return builder
  }

  builder.listeners = listeners => {
    elementProperties.listeners = listeners
    return builder
  }

  builder.styles = styles => {
    elementProperties.styles = styles
    return builder
  }

  propertiesWeakMap.set(builder, elementProperties)

  return builder
}

export const fragment = (...childBuilders) => {
  const builder = {}

  const elementProperties = {
    isFragment: true,
    childBuilders,
  }

  propertiesWeakMap.set(builder, elementProperties)

  return builder
}

const createElement = virtualElement => {
  const { tagName, attributes, referenceHolder, referenceName, bindings, listeners, styles, text } =
    virtualElement.properties

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

  if (text != null) {
    element.innerText = text
  }

  return element
}

const updateElement = virtualElement => {
  const element = virtualElement.getElement()
  const { attributes, bindings, styles, text } = virtualElement.properties

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

  if (text != null && element.innerText !== text) {
    element.innerText = text
  }

  return element
}

const getVirtualTree = builder => {
  const getVirtualElement = ({
    id,
    siblingIndex,
    properties,
    parentVirtualElement,
    isNullBuilder,
    isReconcilerRoot,
  }) => {
    let element
    let children = []
    return {
      id,
      properties,
      isReconcilerRoot,
      isNullBuilder,
      getChildren: () => children,
      getFirstChild: () => children[0],
      getElement: () => element,
      getParent: () => parentVirtualElement,
      getParentElement: () => parentVirtualElement?.getElement() ?? null,
      getPreviousSibling: () => {
        const parentChildren = parentVirtualElement?.getChildren()
        return parentChildren?.[siblingIndex - 1] ?? null
      },
      getPreviousSiblingElement: () => {
        const parentChildren = parentVirtualElement?.getChildren()
        let currentIndex = siblingIndex - 1
        while (true) {
          if (currentIndex < 0) return null
          const previousElement = parentChildren[currentIndex]?.getElement()
          if (previousElement) return previousElement
          currentIndex -= 1
        }
      },
      getNextSibling: () => {
        const parentChildren = parentVirtualElement?.getChildren()
        return parentChildren?.[siblingIndex + 1] ?? null
      },
      getNextSiblingElement: () => {
        const parentChildren = parentVirtualElement?.getChildren()
        let currentIndex = siblingIndex + 1
        while (true) {
          if (currentIndex === parentChildren.length) return null
          const nextElement = parentChildren[currentIndex]?.getElement()
          if (nextElement) return nextElement
          currentIndex += 1
        }
      },
      associateElement: newElement => {
        element = newElement
      },
      append: child => {
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
  let rootVirtualElement

  const recurseBuilders = ({
    parentVirtualElement,
    parentId,
    siblingIndex = 0,
    positionIdIndex = 0,
    builders,
  }) => {
    builders.forEach(builder => {
      const isNullBuilder = builder == null

      const reconcilerRootElement = getReconcilerRootElement(builder)
      const isReconcilerRoot = !!reconcilerRootElement

      const properties = propertiesWeakMap.get(builder)

      if (!properties && !(isNullBuilder || isReconcilerRoot)) {
        throw new Error("Invalid content provided to reconcile function")
      }

      if (properties?.isFragment) {
        recurseBuilders({
          parentVirtualElement,
          parentId,
          siblingIndex,
          positionIdIndex,
          builders: properties.childBuilders,
        })
        return
      }

      const id = getId({ parentId, positionIdIndex, reconcilerId: properties?.reconcilerId })

      const virtualElement = getVirtualElement({
        id,
        siblingIndex,
        properties,
        parentVirtualElement,
        isReconcilerRoot,
        isNullBuilder,
      })

      if (isReconcilerRoot) {
        virtualElement.associateElement(reconcilerRootElement)
      }

      if (!rootVirtualElement) rootVirtualElement = virtualElement

      virtualElementsById[id] = virtualElement

      siblingIndex += 1
      if (!properties?.reconcilerId) {
        positionIdIndex += 1
      }

      if (parentVirtualElement) {
        parentVirtualElement.append(virtualElement)
      }

      if (properties?.childBuilders) {
        recurseBuilders({
          parentVirtualElement: virtualElement,
          parentId: id,
          builders: properties.childBuilders,
        })
      }
    })
  }

  recurseBuilders({
    parentVirtualElement: null,
    parentId: null,
    builders: [builder],
  })

  const getIterator = () => {
    const hasNoContent = !rootVirtualElement?.properties

    let backlog = []
    let current
    let isDone = hasNoContent

    return {
      next: () => {
        if (!current) {
          current = rootVirtualElement
          if (!rootVirtualElement.getChildren().length) isDone = true
          return rootVirtualElement
        }

        let next
        if (current.getFirstChild()) {
          backlog.push(current.getFirstChild)
        }
        if (current.getNextSibling()) {
          next = current.getNextSibling()
        } else if (backlog[0]) {
          next = backlog.shift()()
        } else {
          throw new Error("Unexpected")
        }
        if (!next.getNextSibling() && !next.getFirstChild() && !backlog[0]) {
          isDone = true
        }
        current = next
        return next
      },
      isDone: () => isDone,
    }
  }

  return {
    rootVirtualElement,
    getIterator,
    getById: id => {
      return virtualElementsById[id]
    },
    getDiscardedElements: compareVirtualTree => {
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

export const reconcile = (anyNamedLocked, builder) => {
  const virtualTree = getVirtualTree(builder)
  const oldVirtualTree = oldVirtualTreeWeakMap.get(anyNamedLocked)

  const discardedElements = oldVirtualTree?.getDiscardedElements(virtualTree) ?? []
  discardedElements.forEach(discardedElement => {
    discardedElement.remove()
  })

  const virtualTreeIterator = virtualTree.getIterator()

  while (true) {
    if (virtualTreeIterator.isDone()) break

    const virtualElement = virtualTreeIterator.next()

    const oldVirtualElement = oldVirtualTree?.getById(virtualElement.id)

    if (oldVirtualElement && oldVirtualElement.getElement()) {
      if (virtualElement.isReconcilerRoot) {
        if (oldVirtualElement.getElement() !== virtualElement.getElement()) {
          throw new Error("not yet implemented")
        }
      }

      const isNoop = virtualElement.isReconcilerRoot || virtualElement.isNullBuilder
      if (isNoop) continue

      const element = oldVirtualElement.getElement()

      virtualElement.associateElement(element)

      const parentElement = virtualElement.getParentElement()

      updateElement(virtualElement)

      // Move element if it is in the wrong place
      const oldParentElement = oldVirtualElement.getParentElement()
      const previousElement = virtualElement.getPreviousSiblingElement()
      const oldPreviousElement = oldVirtualElement.getPreviousSiblingElement()
      if (
        parentElement &&
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
      const isNoop =
        virtualElement.isNullBuilder ||
        (virtualElement.isReconcilerRoot && !virtualElement.getElement())

      if (isNoop) continue

      const parentElement = virtualElement.getParentElement()

      const element = (() => {
        if (virtualElement.isReconcilerRoot) {
          return virtualElement.getElement()
        }
        return createElement(virtualElement)
      })()

      const previousElement = virtualElement.getPreviousSiblingElement()

      virtualElement.associateElement(element)

      if (previousElement) {
        previousElement.insertAdjacentElement("afterend", element)
      } else {
        parentElement?.insertAdjacentElement("afterbegin", element)
      }
    }
  }

  oldVirtualTreeWeakMap.set(anyNamedLocked, virtualTree)

  const reconcilerRoot = { element: virtualTree.rootVirtualElement.getElement() }

  // For identification later
  isReconcilerRootWeakMap.set(reconcilerRoot, true)

  return reconcilerRoot
}
