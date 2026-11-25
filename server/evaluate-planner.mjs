import { performance } from "node:perf_hooks"
import { buildPlan, clock } from "./planner.mjs"
import { syntheticScenario } from "./graph-model.mjs"

const date = "2000-01-01"
const fleet = {
  drivers: ["A", "B"].map((id) => ({ id, name: id, status: "Available", shiftStart: "09:00", shiftEnd: "13:30" })),
  vehicles: ["A", "B"].map((id) => ({ id, driverId: id, status: "Available", capacity: 100 })),
}
const strategies = ["greedy", "graph"]
const totals = strategies.map((strategy) => ({ strategy, assigned: 0, unassigned: 0, distanceKm: 0, plannerMs: 0 }))

for (let seed = 1001; seed <= 1040; seed++) {
  const graph = syntheticScenario(seed)
  const positions = new Map(graph.nodes.map((node) => [node.id, node.location]))
  const travel = { ...graph, find: (id) => positions.get(id) }
  const orders = graph.nodes.map((node) => ({
    id: node.id, date, address: node.id, status: "Unassigned", priority: "Standard",
    windowStart: clock(node.start), windowEnd: clock(node.end),
    window: `${clock(node.start)}–${clock(node.end)}`, loadValue: node.load, serviceMinutes: node.service,
  }))
  for (const total of totals) {
    const started = performance.now()
    const plan = buildPlan(date, orders, fleet, travel, total.strategy)
    total.plannerMs += performance.now() - started
    total.unassigned += plan.unassigned.length
    total.assigned += plan.orderCount - plan.unassigned.length
    total.distanceKm += plan.routes.reduce((sum, route) => sum + route.distanceKm, 0)
  }
}

console.log("40 held-out synthetic scenarios. Estimated distance includes assigned orders only.")
console.table(totals.map((total) => ({ ...total, plannerMs: Number(total.plannerMs.toFixed(1)) })))
