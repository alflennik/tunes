import define from "../utilities/define.js"
import { element, fragment } from "../utilities/fun-html.js"

class Tree extends HTMLElement {
  constructor() {
    super()
  }

  initializeActions = () => ({
    handleStart: () => {
      this.application.focus()
    },
    handleKeyDown: (event) => {
      console.log("handleKeyDown")
    },
  })

  reactiveTemplate() {
    const { handleKeyDown, handleStart } = this.actions

    return fragment(
      element("style").children(`
        
      `),
      element("h1").children("Tunes"),
      element("button").listeners({ click: handleStart }).children("Start"),
      element("div")
        .reference(this, "application")
        .attributes({ role: "application", tabindex: 0 })
        .listeners({ keydown: handleKeyDown })
        .children(
          element("ul").children(
            element("li").attributes({ id: "demonhead" }).children("NEHAN / Fly With Me"),
            element("li").attributes({ id: "radiantfreedom" }).children("Free")
          )
        )
    )
  }
}

define({ "tree-element": Tree })
