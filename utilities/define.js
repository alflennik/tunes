import { titleToTrain } from "./convertCase.js"
import { build } from "./fun-html.js"

export const tagNameWeakMap = new WeakMap()

export default async (Components) => {
  let definitions = []
  for (const [name, Component] of Object.entries(Components)) {
    definitions.push(defineComponent(name, Component))
  }

  await Promise.all(definitions)
}

function defineComponent(name, UserComponent) {
  if (/^[A-Z]/.test(name)) name = titleToTrain(name)

  tagNameWeakMap.set(UserComponent, name)

  class ShadowInnerComponent extends UserComponent {
    #mutableState
    #immutableState

    static get observedAttributes() {
      return ["bindings"]
    }

    constructor() {
      super()

      const stateSetters = {}

      if (this.initializeState) {
        this.#mutableState = this.initializeState

        Object.keys(this.initializeState).forEach((name) => {
          const setterName = "set" + name.substr(0, 1).toUpperCase() + name.substr(1)

          stateSetters[setterName] = (value) => {
            this.#mutableState[name] = value
            this.#refresh()
          }
        })

        this.#refreshImmutableState()
      }

      if (this.initializeActions) {
        this.actions = {}
        const actions = this.initializeActions({ stateSetters })
        Object.entries(actions).forEach(([actionName, actionFunction]) => {
          this.actions[actionName] = (...args) => {
            return actionFunction(...args)
          }
        })
      }
    }

    get state() {
      return this.#immutableState
    }

    connectedCallback() {
      // According to MDN connectedCallback can get triggered even when disconnected (!)
      if (!this.isConnected) return

      if (this.reactiveTemplate) {
        this.#refresh()
      }

      forwardProperty(this, UserComponent, "connectedCallback")
    }

    #refreshImmutableState() {
      let immutableState = structuredClone(this.#mutableState)

      // https://medium.com/@nikhil_gupta/how-to-deepfreeze-a-nested-object-array-800671147d53
      const deepFreeze = (obj) => {
        if (obj && typeof obj === "object" && !Object.isFrozen(obj)) {
          Object.freeze(obj)
          Object.getOwnPropertyNames(obj).forEach((prop) => deepFreeze(obj[prop]))
        }
        return obj
      }

      this.#immutableState = deepFreeze(immutableState)
    }

    #refresh() {
      this.#refreshImmutableState()
      if (this.reactiveTemplate) {
        build(this)
      }
    }

    setBindings(bindings) {
      this.bindings = bindings
      this.#refresh()
    }
  }

  function forwardProperty(component, UserComponent, propertyName, args = []) {
    if (UserComponent.prototype[propertyName]) {
      UserComponent.prototype[propertyName].call(component, ...args)
    }
  }

  customElements.define(name, ShadowInnerComponent)
  return customElements.whenDefined(name)
}
