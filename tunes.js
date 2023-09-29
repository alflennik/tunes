import { loadGraph } from "./utilities/multigraph.js"
import allUnitPaths from "./units/all.js"

loadGraph(allUnitPaths.map(unitPath => `/units/${unitPath}`))
