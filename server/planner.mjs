import { demoTravel } from "./travel.mjs"
import { graphScores } from "./graph-model.mjs"

const priorityRank = { High: 0, Standard: 1, Low: 2 }
const pendingStatuses = new Set(["Scheduled", "Unassigned", "Exception"])
const method = "Greedy insertion"

export function minutes(time) {
  const [hours, mins] = time.split(":").map(Number)
  return hours * 60 + mins
}

export function clock(time) {
  const hours = String(Math.floor(time / 60)).padStart(2, "0")
  return `${hours}:${String(time % 60).padStart(2, "0")}`
}

export function schedule(driver, orders, travel, from = travel.depot, readyAt = minutes(driver.shiftStart)) {
  let time = readyAt
  let location = from
  let distanceKm = 0
  const stops = []
  for (const order of orders) {
    const leg = travel.leg(location, order.location)
    if (!leg) return null
    time = Math.max(time + leg.minutes, minutes(order.windowStart))
    if (time > minutes(order.windowEnd)) return null
    stops.push({
      orderId: order.id,
      address: order.address,
      eta: clock(time),
      window: order.window,
      loadKg: order.loadValue,
      serviceMinutes: order.serviceMinutes,
      coordinates: travel.coordinates?.(order.location),
    })
    time += order.serviceMinutes
    distanceKm += leg.distanceKm
    location = order.location
  }

  const back = travel.leg(location, travel.depot)
  if (!back) return null
  const returnTime = time + back.minutes
  if (returnTime > minutes(driver.shiftEnd)) return null
  return {
    stops,
    returnAt: clock(returnTime),
    distanceKm: distanceKm + back.distanceKm,
    durationMinutes: returnTime - readyAt,
  }
}

function bestInsertion(routes, order, travel) {
  let best = null
  for (const route of routes) {
    if (route.loadKg + order.loadValue - route.vehicle.capacity > 1e-9) continue
    for (let index = 0; index <= route.orders.length; index++) {
      const orders = route.orders.toSpliced(index, 0, order)
      const result = schedule(route.driver, orders, travel)
      if (!result) continue
      const addedDistance = result.distanceKm - (route.schedule?.distanceKm ?? 0)
      if (!best || addedDistance < best.addedDistance ||
        (addedDistance === best.addedDistance && result.durationMinutes < best.result.durationMinutes)) {
        best = { route, orders, result, addedDistance }
      }
    }
  }
  return best
}

export function planningOrders(date, allOrders) {
  return allOrders.filter((order) => order.date === date && pendingStatuses.has(order.status))
}

export function buildPlan(date, allOrders, { drivers, vehicles }, travel = demoTravel, strategy = "greedy") {
  const availableDrivers = new Map(drivers
    .filter((driver) => driver.status === "Available")
    .map((driver) => [driver.id, driver]))
  const routes = vehicles
    .filter((vehicle) => vehicle.status === "Available" && availableDrivers.has(vehicle.driverId))
    .map((vehicle) => ({
      vehicle, driver: availableDrivers.get(vehicle.driverId), orders: [], schedule: null, loadKg: 0,
    }))
  const maxCapacity = routes.reduce((max, route) => Math.max(max, route.vehicle.capacity), 0)
  const orders = planningOrders(date, allOrders)
  const nodes = orders.map((order) => ({
    id: order.id, location: travel.find(order.address), start: minutes(order.windowStart),
    end: minutes(order.windowEnd), service: order.serviceMinutes,
  })).filter((node) => node.location !== undefined)
  const scores = strategy === "graph" ? graphScores(nodes, travel) : new Map()
  orders.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] ||
    (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0) ||
    a.windowEnd.localeCompare(b.windowEnd) || a.id.localeCompare(b.id))

  const unassigned = []
  for (const order of orders) {
    const location = travel.find(order.address)
    const assignment = location !== undefined && bestInsertion(routes, { ...order, location }, travel)
    if (assignment) {
      assignment.route.orders = assignment.orders
      assignment.route.schedule = assignment.result
      assignment.route.loadKg += order.loadValue
      continue
    }

    let reason = "No feasible insertion within delivery windows and driver shifts."
    if (!routes.length) reason = "No available driver paired with an available vehicle."
    else if (order.loadValue - maxCapacity > 1e-9) reason = "Order exceeds the capacity of every available vehicle."
    else if (location === undefined) reason = travel.missingAddress
    else if (!travel.leg(travel.depot, location) || !travel.leg(location, travel.depot)) {
      reason = "No road route was found between this address and the depot."
    }
    else if (routes.every((route) => route.loadKg + order.loadValue - route.vehicle.capacity > 1e-9)) {
      reason = "The remaining capacity of every available vehicle is too low."
    }
    unassigned.push({ orderId: order.id, address: order.address, reason })
  }

  return {
    date,
    method: strategy === "graph" ? "GNN-assisted greedy insertion" : method,
    travelSource: travel.source,
    orderCount: orders.length,
    routes: routes.filter((route) => route.schedule).map((route) => ({
      vehicleId: route.vehicle.id,
      driverId: route.driver.id,
      driverName: route.driver.name,
      shiftStart: route.driver.shiftStart,
      shiftEnd: route.driver.shiftEnd,
      capacityKg: route.vehicle.capacity,
      loadKg: Number(route.loadKg.toFixed(8)),
      ...route.schedule,
      distanceKm: Number(route.schedule.distanceKm.toFixed(3)),
    })),
    unassigned,
  }
}
