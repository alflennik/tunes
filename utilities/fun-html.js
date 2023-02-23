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

  function builder(...childBuilders) {
    elementProperties.childBuilders = utilities.convertAnyRawStringsToTextBuilders(childBuilders)
    return builder
  }

  builder.key = (key) => {
    elementProperties.key = key
    return builder
  }

  builder.setAttributes = (attributes) => {
    elementProperties.attributes = attributes
    return builder
  }

  builder.getReference = (referenceHolder, referenceName) => {
    elementProperties.referenceHolder = referenceHolder
    elementProperties.referenceName = referenceName
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

  builder.setBindings = (bindings) => {
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
  const { tagName, attributes, referenceHolder, referenceName, bindings, text, bindingParent } =
    elementProperties

  const element = document.createElement(tagName)

  if (attributes) {
    Object.entries(attributes).forEach(([attributeName, attributeValue]) => {
      element.setAttribute(attributeName, attributeValue)
    })
  }

  if (referenceHolder && referenceName) {
    referenceHolder[referenceName] = element
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
      element.setAttribute(attributeName, attributeValue)
    })
  }

  if (bindings) {
    element.setBindings(bindings)
  }

  return element
}

/*
const debugBuilder = (component, builder) => {
  let refs = {};
  const getId = () => Math.random().toString().substr(2, 5);
  console.log(
    JSON.stringify(
      {
        [component.tagName.toLowerCase()]: (() => {
          const recurse = (builders) => {
            return builders.map((childBuilder) => {
              const getElementProperties =
                getElementPropertiesWeapMap.get(childBuilder);
              const elementProperties = getElementProperties();

              const output = {};
              if (elementProperties.tagName) {
                output.tagName = elementProperties.tagName;
              }
              if (elementProperties.isFragment) {
                output.isFragment = elementProperties.isFragment;
              }
              if (elementProperties.text != null) {
                output.text = elementProperties.text;
              }
              if (elementProperties.element && !elementProperties.isFragment) {
                const id = getId();
                refs[id] = elementProperties.element;
                const elementNodeType = 1;
                const textNodeType = 3;
                if (elementProperties.element.nodeType === elementNodeType) {
                  output.element = `${elementProperties.element?.tagName.toLowerCase()} (${id})`;
                } else if (
                  elementProperties.element.nodeType === textNodeType
                ) {
                  output.textNode = `textNode (${id})`;
                }
              }

              if (elementProperties.childBuilders) {
                output.children = recurse(elementProperties.childBuilders);
              }

              return output;
            });
          };
          return recurse([builder]);
        })(),
      },
      null,
      2
    )
  );

  return refs;
};
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

export const a = element("a")
export const abbr = element("abbr")
export const article = element("article")
export const aside = element("aside")
export const audio = element("audio")
export const b = element("b")
export const blockquote = element("blockquote")
export const br = element("br", { isSelfClosing: true })
export const button = element("button")
export const canvas = element("canvas")
export const caption = element("caption")
export const code = element("code")
export const datalist = element("datalist")
export const dd = element("dd")
export const del = element("del")
export const details = element("details")
export const dialog = element("dialog")
export const div = element("div")
export const dl = element("dl")
export const dt = element("dt")
export const em = element("em")
export const fieldset = element("fieldset")
export const figcaption = element("figcaption")
export const figure = element("figure")
export const footer = element("footer")
export const form = element("form")
export const h1 = element("h1")
export const h2 = element("h2")
export const h3 = element("h3")
export const h4 = element("h4")
export const h5 = element("h5")
export const h6 = element("h6")
export const header = element("header")
export const hr = element("hr", { isSelfClosing: true })
export const i = element("i")
export const iframe = element("iframe")
export const img = element("img", { isSelfClosing: true })
export const input = element("input", { isSelfClosing: true })
export const label = element("label")
export const legend = element("legend")
export const li = element("li")
export const main = element("main")
export const nav = element("nav")
export const ol = element("ol")
export const optgroup = element("optgroup")
export const option = element("option")
export const p = element("p")
export const pre = element("pre")
export const section = element("section")
export const select = element("select")
export const span = element("span")
export const strong = element("strong")
export const summary = element("summary")
export const svg = element("svg")
export const table = element("table")
export const tbody = element("tbody")
export const td = element("td")
export const textarea = element("textarea")
export const tfoot = element("tfoot")
export const th = element("th")
export const thead = element("thead")
export const tr = element("tr")
export const ul = element("ul")
export const style = element("style")
