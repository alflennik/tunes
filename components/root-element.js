import define from "../utilities/define.js";
import { h1, main, component, p } from "../utilities/fun-html.js";

class RootElement extends HTMLElement {
  constructor() {
    super();
  }
  reactiveTemplate() {
    return main(
      h1("Description Player"),
      p("Hit play on the YouTube player to start the audio description."),
      component("description-player")
    );
  }
}

define({ RootElement });
