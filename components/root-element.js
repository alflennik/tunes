import define from "../utilities/define.js";
import { h1, main, component } from "../utilities/fun-html.js";

class RootElement extends HTMLElement {
  constructor() {
    super();
  }
  reactiveTemplate() {
    return main(h1("Description Player"), component("description-player"));
  }
}

define({ RootElement });
