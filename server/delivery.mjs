import { buildPlan, clock, minutes, planningOrders, schedule } from "./planner.mjs"
import { demoTravel, roadMatrixTravel } from "./travel.mjs"
import { isDate, isTime } from "./validation.mjs"

export function createDeliveryEventsTable(db) {
  db.exec(`
    CREATE TABLE delivery_events (
      id INTEGER PRIMARY KEY,
      planId INTEGER NOT NULL UNIQUE REFERENCES plans (id),
      vehicleId TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('delivered', 'delay')),
      orderId TEXT,
      at TEXT NOT NULL,
      delayMinutes INTEGER
    ) STRICT;
  `)
}

function reviseRoute(route, driver, pending, orders, readyAt, travel) {
  const completed = route.stops.filter((stop) => stop.completedAt)
  let location = travel.depot
  let traveledKm = 0
  for (const stop of completed) {
    const next = travel.find(stop.address)
    traveledKm += travel.leg(location, next).distanceKm
    location = next
  }

  const kept = []
  const exceptions = []
  let projected = schedule(driver, [], travel, location, readyAt)
  for (const stop of pending) {
    const order = orders.get(stop.orderId)
    const candidate = { ...order, location: travel.find(stop.address) }
    const next = schedule(driver, [...kept, candidate], travel, location, readyAt)
    if (next) {
      kept.push(candidate)
      projected = next
    } else {
      exceptions.push({
        orderId: stop.orderId,
        address: stop.address,
        reason: "The updated route cannot reach this stop within its window and return within the driver’s shift.",
      })
    }
  }

  const back = travel.leg(location, travel.depot)
  return {
    route: {
      ...route,
      shiftStart: driver.shiftStart,
      shiftEnd: driver.shiftEnd,
      readyAt: clock(readyAt),
      stops: [...completed, ...(projected?.stops ?? [])],
      returnAt: projected?.returnAt ?? null,
      durationMinutes: readyAt - minutes(driver.shiftStart) + (projected?.durationMinutes ?? back?.minutes ?? 0),
      distanceKm: Number((traveledKm + (projected?.distanceKm ?? back?.distanceKm ?? 0)).toFixed(3)),
    },
    exceptions,
  }
}

export function validateDeliveryEvent(input) {
  if (!input || !isDate(input.date)) return "Enter a valid planning date."
  if (!Number.isSafeInteger(input.planId) || input.planId < 1 || typeof input.vehicleId !== "string") {
    return "Select a valid plan and vehicle."
  }
  if (input.type === "delivered" && typeof input.orderId === "string" && isTime(input.at)) return null
  if (input.type === "delay" && Number.isSafeInteger(input.minutes) && input.minutes >= 1 && input.minutes <= 720) return null
  return "Enter a valid completion time or a delay from 1 to 720 minutes."
}

export function prepareDelivery(db, { orders, fleet, plans }, roadProvider) {
  const insertEvent = db.prepare(`
    INSERT INTO delivery_events (planId, vehicleId, type, orderId, at, delayMinutes)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const deliver = db.prepare("UPDATE orders SET status = 'Delivered', driver = ? WHERE id = ? AND status <> 'Delivered'")

  function write(operation) {
    db.exec("BEGIN IMMEDIATE")
    try {
      const result = operation()
      db.exec("COMMIT")
      return result
    } catch (error) {
      db.exec("ROLLBACK")
      throw error
    }
  }

  const inProgress = { status: 409, error: "This plan is already in progress. Update it from Live Tracking." }

  return {
    generate: async (date, mode = "demo") => {
      if (mode === "demo") {
        return write(() => plans.latest(date)?.event ? inProgress :
          { status: 201, plan: plans.save(buildPlan(date, orders.list(), fleet.list())) })
      }
      const previous = plans.latest(date)
      if (previous?.event) return inProgress
      if (!roadProvider) return { status: 503, error: "Road routing is unavailable. Choose Demo grid or configure the provider." }

      const inputs = planningOrders(date, orders.list())
      const result = await roadProvider(inputs.map((order) => order.address))
      if (!result.snapshot) return result

      return write(() => {
        if (plans.latest(date)?.id !== previous?.id ||
          JSON.stringify(planningOrders(date, orders.list())) !== JSON.stringify(inputs)) {
          return { status: 409, error: "The plan or its orders changed while loading road times. Try optimizing again." }
        }
        // Read fleet availability inside the write transaction because travel times don't depend on it.
        const plan = buildPlan(date, inputs, fleet.list(), roadMatrixTravel(result.snapshot))
        const saved = plans.save({ ...plan, travelMode: "road" })
        plans.saveTravel(saved.id, result.snapshot)
        return { status: 201, plan: saved }
      })
    },
    record: (input) => write(() => {
      const plan = plans.latest(input.date)
      if (!plan || plan.id !== input.planId) {
        return { status: 409, error: "The plan has changed. Reload it to see the latest updates." }
      }
      const route = plan.routes.find((item) => item.vehicleId === input.vehicleId)
      const pending = route?.stops.filter((stop) => !stop.completedAt) ?? []
      if (!pending.length) return { status: 400, error: "This vehicle has no pending stops." }
      const driver = route.shiftEnd ? route : fleet.list().drivers.find((item) => item.id === route.driverId)
      if (!driver) return { status: 400, error: "The route’s driver shift is unavailable." }
      const originalPlanId = plan.travelPlanId ?? plan.id
      const snapshot = plan.travelMode === "road" ? plans.loadTravel(originalPlanId) : null
      if (plan.travelMode === "road" && !snapshot) {
        return { status: 409, error: "The original road travel estimates could not be found." }
      }
      const travel = snapshot ? roadMatrixTravel(snapshot) : demoTravel

      const previous = minutes(route.readyAt ?? driver.shiftStart)
      const completion = input.type === "delivered"
      const readyAt = completion ? minutes(input.at) : previous + input.minutes
      if (readyAt < previous || readyAt >= 1440) {
        return { status: 400, error: "The updated time must follow the previous update on this planning date." }
      }
      if (completion && pending[0].orderId !== input.orderId) {
        return { status: 400, error: "Only the next pending stop can be marked delivered." }
      }

      const orderRecords = new Map(orders.list().map((order) => [order.id, order]))
      const event = {
        vehicleId: route.vehicleId,
        type: input.type,
        orderId: completion ? input.orderId : null,
        at: clock(readyAt),
        delayMinutes: completion ? null : input.minutes,
      }
      const updatedRoute = completion ? {
        ...route,
        stops: route.stops.map((stop) => stop.orderId === input.orderId ? { ...stop, completedAt: event.at } : stop),
      } : route
      if (completion && !deliver.run(route.driverName, Number(input.orderId.slice(3))).changes) {
        return { status: 409, error: "This delivery was already updated. Reload the plan." }
      }
      const revised = reviseRoute(updatedRoute, driver, completion ? pending.slice(1) : pending, orderRecords, readyAt, travel)
      const saved = plans.save({
        date: plan.date,
        method: plan.method,
        travelSource: plan.travelSource,
        ...(snapshot ? { travelMode: "road", travelPlanId: originalPlanId } : {}),
        orderCount: plan.orderCount,
        routes: plan.routes.map((item) => item === route ? revised.route : item),
        unassigned: [...plan.unassigned, ...revised.exceptions],
        previousPlanId: plan.id,
        event,
      })
      insertEvent.run(saved.id, event.vehicleId, event.type, event.orderId, event.at, event.delayMinutes)
      return { status: 201, plan: saved }
    }),
  }
}
