import assert from "node:assert/strict"
import { once } from "node:events"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { createApp } from "./app.mjs"
import { openDatabase } from "./database.mjs"
import { buildPlan } from "./planner.mjs"
import { addTestOrder, addTestVehicle } from "./test-fixtures.mjs"

const date = "2026-10-29"

test("planner uses available pairs and respects capacity, service time, deadlines, and shift end", () => {
  const driver = { status: "Available", shiftStart: "09:00", shiftEnd: "11:00" }
  const vehicle = { status: "Available", capacity: 50 }
  const order = {
    date, status: "Unassigned", address: "7 Ashok Lane, West End", priority: "Standard",
    windowStart: "09:20", windowEnd: "09:30", window: "09:20–09:30",
    loadValue: 30, serviceMinutes: 15,
  }
  const plan = buildPlan(date, [
    { ...order, id: "FIRST", priority: "High" },
    { ...order, id: "SECOND" },
    { ...order, id: "OVERWEIGHT", loadValue: 60 },
    { ...order, id: "LATE", loadValue: 5, windowStart: "10:50", windowEnd: "10:59" },
    { ...order, id: "DEADLINE", loadValue: 5, windowStart: "09:00", windowEnd: "09:10" },
    { ...order, id: "UNKNOWN", loadValue: 5, address: "Unknown address" },
    { ...order, id: "DONE", status: "Delivered" },
    { ...order, id: "ON-ROUTE", status: "In transit" },
    { ...order, id: "TOMORROW", date: "2026-10-30" },
  ], {
    drivers: [
      { ...driver, id: "D1", name: "First driver" },
      { ...driver, id: "D2", name: "Second driver" },
      { ...driver, id: "D3", name: "Busy driver", status: "On route" },
    ],
    vehicles: [
      { ...vehicle, id: "V1", driverId: "D1" },
      { ...vehicle, id: "V2", driverId: "D2" },
      { ...vehicle, id: "V3", driverId: "D3", capacity: 100 },
      { ...vehicle, id: "V4", driverId: null, capacity: 100 },
    ],
  })
  assert.equal(plan.orderCount, 6)
  assert.deepEqual(plan.routes.map((route) => route.stops.map((stop) => stop.orderId)), [["FIRST"], ["SECOND"]])
  for (const route of plan.routes) {
    assert.equal(route.loadKg, 30)
    assert.equal(route.stops[0].eta, "09:20")
    assert.equal(route.returnAt, "09:47")
    assert.equal(route.distanceKm, 8)
  }
  const reasons = new Map(plan.unassigned.map(({ orderId, reason }) => [orderId, reason]))
  assert.match(reasons.get("OVERWEIGHT"), /capacity/)
  assert.match(reasons.get("LATE"), /shifts/)
  assert.match(reasons.get("DEADLINE"), /windows/)
  assert.match(reasons.get("UNKNOWN"), /outside the demo/)
})

test("plans API saves a dated snapshot and reads the latest plan after a restart", async () => {
  const directory = mkdtempSync(join(tmpdir(), "route-mind-plan-test-"))
  const filename = join(directory, "orders.sqlite")
  const db = openDatabase(filename)
  addTestVehicle(db)
  addTestOrder(db, date)
  const server = createApp(db).listen(0, "127.0.0.1")
  let saved
  try {
    try {
      await once(server, "listening")
      const url = `http://127.0.0.1:${server.address().port}/api/plans`
      const generate = (planningDate) => fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: planningDate, travelMode: "demo" }),
      })
      assert.equal((await generate("2026-02-30")).status, 400)
      const first = await generate(date)
      assert.equal(first.status, 201)
      const firstPlan = await first.json()
      assert.ok(firstPlan.routes.length)
      const second = await generate(date)
      assert.equal(second.status, 201)
      saved = await second.json()
      assert.ok(saved.id > firstPlan.id)
      const latest = await fetch(`${url}/latest?date=${date}`)
      assert.equal(latest.status, 200)
      assert.deepEqual(await latest.json(), saved)
    } finally {
      await new Promise((resolve) => server.close(resolve))
      db.close()
    }
    const reopened = openDatabase(filename)
    try {
      assert.deepEqual(reopened.plans.latest(date), saved)
      assert.equal(reopened.plans.latest("2026-10-30"), null)
    } finally {
      reopened.close()
    }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
