import { titleToTrain } from "./convertCase.js";
import { build } from "./fun-html.js";

export default async (Components) => {
  let definitions = [];
  for (const [name, Component] of Object.entries(Components)) {
    definitions.push(defineComponent(name, Component));
  }

  await Promise.all(definitions);
};

function defineComponent(name, UserComponent) {
  if (/^[A-Z]/.test(name)) name = titleToTrain(name);

  class ShadowInnerComponent extends UserComponent {
    static get observedAttributes() {
      return ["bindings"];
    }

    constructor() {
      super();

      if (this.initialState) {
        this.state = immer.produce(this.initialState, (state) => {});
      }

      if (this.getActions) {
        const produceNewState = (produceFunction) => {
          this.state = immer.produce(this.state, produceFunction);
          this.#refresh();
        };

        this.actions = this.getActions({ produceNewState });
      }
    }

    connectedCallback() {
      // According to MDN connectedCallback can get triggered even when disconnected (!)
      if (!this.isConnected) return;

      if (this.reactiveTemplate) {
        this.#refresh();
      }

      forwardProperty(this, UserComponent, "connectedCallback");
    }

    #refresh() {
      if (this.reactiveTemplate) {
        build(this);
      }
    }

    setBindings(bindings) {
      this.bindings = bindings;
      this.#refresh();
    }
  }

  function forwardProperty(component, UserComponent, propertyName, args = []) {
    if (UserComponent.prototype[propertyName]) {
      UserComponent.prototype[propertyName].call(component, ...args);
    }
  }

  customElements.define(name, ShadowInnerComponent);
  return customElements.whenDefined(name);
}
