import type { RoutePlan } from "./api"

function orderOutcomes(plan: RoutePlan) {
  const outcomes = new Map<string, string>()
  for (const route of plan.routes) {
    for (const stop of route.stops) {
      outcomes.set(stop.orderId, stop.completedAt
        ? `Delivered at ${stop.completedAt}`
        : `ETA ${stop.eta} · ${route.vehicleId}`)
    }
  }
  for (const order of plan.unassigned) {
    outcomes.set(order.orderId, `Unassigned · ${order.reason}`)
  }
  return outcomes
}

export function comparePlans(previous: RoutePlan, current: RoutePlan) {
  const before = orderOutcomes(previous)
  const after = orderOutcomes(current)
  const changes = []
  for (const id of new Set([...before.keys(), ...after.keys()])) {
    if (before.get(id) !== after.get(id)) {
      changes.push([id, before.get(id) ?? "—", after.get(id) ?? "—"])
    }
  }
  return changes
}
