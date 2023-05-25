import { titleToTrain } from "./convertCase.js"
import { build } from "./reconciler.js"

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
    #buildQueued = false
    #currentlyRunningAction = false
    #didStateChange = false

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
            this.#didStateChange = true
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
            this.#currentlyRunningAction = true
            const result = actionFunction(...args)
            this.#currentlyRunningAction = false
            this.#refresh()
            return result
          }
        })
      }
    }

    get state() {
      return this.#immutableState
    }

    async connectedCallback() {
      // According to MDN connectedCallback can get triggered even when disconnected (!)
      if (!this.isConnected) return

      await forwardProperty(this, UserComponent, "connectedCallback")

      if (this.reactiveTemplate) {
        this.#refresh()
      }
    }

    #refreshImmutableState() {
      let immutableState
      try {
        immutableState = structuredClone(this.#mutableState)
      } catch (error) {
        throw new Error(
          "Found state which cannot be cloned, all state must be able to be cloned with the " +
            "structedClone API."
        )
      }

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
      forwardProperty(this, UserComponent, "bindingsChangedCallback")
      if (
        this.reactiveTemplate &&
        this.#buildQueued === false &&
        this.#currentlyRunningAction === false
      ) {
        this.#buildQueued = true
        const getBuilder = () => {
          this.#didStateChange = false
          let builder = this.reactiveTemplate()
          if (this.#didStateChange) {
            this.#didStateChange = false
            builder = this.reactiveTemplate()
            if (this.#didStateChange) {
              throw new Error("Infinite loop detected")
            }
          }
          return builder
        }

        build(this, getBuilder).then(() => {
          this.#buildQueued = false
        })
      }
    }

    setBindings(bindings) {
      this.bindings = bindings
      if (this.isConnected) {
        this.#refresh()
      }
    }
  }

  function forwardProperty(component, UserComponent, propertyName, args = []) {
    if (UserComponent.prototype[propertyName]) {
      return UserComponent.prototype[propertyName].call(component, ...args)
    }
  }

  customElements.define(name, ShadowInnerComponent)
  return customElements.whenDefined(name)
}
