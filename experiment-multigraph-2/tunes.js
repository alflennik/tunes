import multigraph from "./utilities/multigraph.js"
import componentPaths from "./components/component-list.js"

multigraph.loadGraph({
  componentPaths: componentPaths.map(
    componentPath => `/experiment-multigraph-2/components/${componentPath}`
  ),
})
