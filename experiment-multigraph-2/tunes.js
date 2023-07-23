import { loadGraph } from "./utilities/multigraph.js"
import allUnitPaths from "./units/all.js"

loadGraph(allUnitPaths.map(unitPath => `/experiment-multigraph-2/units/${unitPath}`))
