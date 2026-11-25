import { depot, findLocation, travelLeg } from "./travel.mjs"

const priorityRank = { High: 0, Standard: 1, Low: 2 }
const pendingStatuses = new Set(["Scheduled", "Unassigned", "Exception"])
const method = "Greedy insertion"

function minutes(time) {
  const [hours, mins] = time.split(":").map(Number)
  return hours * 60 + mins
}

function clock(time) {
  const hours = String(Math.floor(time / 60)).padStart(2, "0")
  return `${hours}:${String(time % 60).padStart(2, "0")}`
}

function schedule(driver, orders) {
  let time = minutes(driver.shiftStart)
  let location = depot
  let distanceKm = 0
  const stops = []
  for (const order of orders) {
    const leg = travelLeg(location, order.location)
    time = Math.max(time + leg.minutes, minutes(order.windowStart))
    if (time > minutes(order.windowEnd)) return null
    stops.push({
      orderId: order.id,
      address: order.address,
      eta: clock(time),
      window: order.window,
      loadKg: order.loadValue,
    })
    time += order.serviceMinutes
    distanceKm += leg.distanceKm
    location = order.location
  }

  const back = travelLeg(location, depot)
  const returnTime = time + back.minutes
  if (returnTime > minutes(driver.shiftEnd)) return null
  return {
    stops,
    returnAt: clock(returnTime),
    distanceKm: distanceKm + back.distanceKm,
    durationMinutes: returnTime - minutes(driver.shiftStart),
  }
}

function bestInsertion(routes, order) {
  let best = null
  for (const route of routes) {
    if (route.loadKg + order.loadValue - route.vehicle.capacity > 1e-9) continue
    for (let index = 0; index <= route.orders.length; index++) {
      const orders = route.orders.toSpliced(index, 0, order)
      const result = schedule(route.driver, orders)
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

export function buildPlan(date, allOrders, { drivers, vehicles }) {
  const availableDrivers = new Map(drivers
    .filter((driver) => driver.status === "Available")
    .map((driver) => [driver.id, driver]))
  const routes = vehicles
    .filter((vehicle) => vehicle.status === "Available" && availableDrivers.has(vehicle.driverId))
    .map((vehicle) => ({
      vehicle, driver: availableDrivers.get(vehicle.driverId), orders: [], schedule: null, loadKg: 0,
    }))
  const maxCapacity = routes.reduce((max, route) => Math.max(max, route.vehicle.capacity), 0)
  const orders = allOrders
    .filter((order) => order.date === date && pendingStatuses.has(order.status))
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] ||
      a.windowEnd.localeCompare(b.windowEnd) || a.id.localeCompare(b.id))

  const unassigned = []
  for (const order of orders) {
    const location = findLocation(order.address)
    const assignment = location && bestInsertion(routes, { ...order, location })
    if (assignment) {
      assignment.route.orders = assignment.orders
      assignment.route.schedule = assignment.result
      assignment.route.loadKg += order.loadValue
      continue
    }

    let reason = "No feasible insertion within delivery windows and driver shifts."
    if (!routes.length) reason = "No available driver paired with an available vehicle."
    else if (order.loadValue - maxCapacity > 1e-9) reason = "Order exceeds the capacity of every available vehicle."
    else if (!location) reason = "This address is outside the demo travel data."
    else if (routes.every((route) => route.loadKg + order.loadValue - route.vehicle.capacity > 1e-9)) {
      reason = "The remaining capacity of every available vehicle is too low."
    }
    unassigned.push({ orderId: order.id, address: order.address, reason })
  }

  return {
    date,
    method,
    travelSource: "Demo travel estimates",
    orderCount: orders.length,
    routes: routes.filter((route) => route.schedule).map((route) => ({
      vehicleId: route.vehicle.id,
      driverId: route.driver.id,
      driverName: route.driver.name,
      capacityKg: route.vehicle.capacity,
      loadKg: Number(route.loadKg.toFixed(8)),
      ...route.schedule,
    })),
    unassigned,
  }
}
