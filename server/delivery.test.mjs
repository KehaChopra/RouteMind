import assert from "node:assert/strict"
import { once } from "node:events"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { DatabaseSync } from "node:sqlite"
import { test } from "node:test"
import { createApp } from "./app.mjs"
import { openDatabase } from "./database.mjs"
import { comparePlans } from "../src/reporting.ts"

test("delivery updates persist and a delay changes pending ETAs while preserving completed stops", async () => {
  const date = "2026-11-01"
  const directory = mkdtempSync(join(tmpdir(), "route-mind-delivery-test-"))
  const filename = join(directory, "orders.sqlite")
  const db = openDatabase(filename)
  const server = createApp(db).listen(0, "127.0.0.1")
  let revised
  try {
    try {
      await once(server, "listening")
      const base = `http://127.0.0.1:${server.address().port}/api`
      const post = (path, body) => fetch(base + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const order = {
        customer: "Demo customer", address: "7 Ashok Lane, West End", date,
        priority: "Standard", parcelCount: 1, loadValue: 5, serviceMinutes: 10,
      }
      const first = db.orders.create({ ...order, windowStart: "09:00", windowEnd: "09:20" })
      const second = db.orders.create({ ...order, windowStart: "09:25", windowEnd: "10:20" })
      const third = db.orders.create({ ...order, windowStart: "09:40", windowEnd: "09:45" })
      const generated = await post("/plans", { date })
      assert.equal(generated.status, 201)
      const original = await generated.json()
      const [route] = original.routes
      assert.deepEqual(route.stops.map((stop) => stop.orderId), [first.id, second.id, third.id])

      const update = (planId, event) => post("/delivery-events", { date, planId, vehicleId: route.vehicleId, ...event })
      const outOfOrder = await update(original.id, { type: "delivered", orderId: second.id, at: "09:22" })
      assert.equal(outOfOrder.status, 400)
      const completed = await update(original.id, { type: "delivered", orderId: first.id, at: "09:22" })
      assert.equal(completed.status, 201)
      const afterDelivery = await completed.json()
      const completedStop = afterDelivery.routes[0].stops[0]
      assert.equal(completedStop.completedAt, "09:22")
      assert.equal(db.orders.list().find((item) => item.id === first.id).status, "Delivered")

      const stale = await update(original.id, { type: "delay", minutes: 25 })
      assert.equal(stale.status, 409)
      const delayed = await update(afterDelivery.id, { type: "delay", minutes: 25 })
      assert.equal(delayed.status, 201)
      revised = await delayed.json()
      assert.equal(revised.previousPlanId, afterDelivery.id)
      assert.deepEqual(revised.routes[0].stops[0], completedStop)
      assert.equal(afterDelivery.routes[0].stops[1].eta, "09:25")
      assert.equal(revised.routes[0].stops[1].eta, "09:47")
      assert.equal(revised.routes[0].durationMinutes, 69)
      assert.equal(revised.unassigned[0].orderId, third.id)
      assert.match(revised.unassigned[0].reason, /updated route/)
      assert.equal((await post("/plans", { date })).status, 409)

      const history = await fetch(`${base}/plans?date=${date}`)
      assert.equal(history.status, 200)
      const runs = await history.json()
      assert.deepEqual(runs, [revised, afterDelivery, original])
      const changes = comparePlans(runs[1], runs[0])
      assert.deepEqual(changes.map(([id]) => id), [second.id, third.id])
      assert.match(changes[0][1], /09:25/)
      assert.match(changes[0][2], /09:47/)
      assert.match(changes[1][2], /Unassigned/)

      const analytics = await fetch(`${base}/analytics?date=${date}`)
      assert.equal(analytics.status, 200)
      assert.deepEqual(await analytics.json(), {
        planId: revised.id,
        travelMode: "demo",
        orderCount: 3,
        completed: 1,
        pending: 1,
        unassigned: 1,
        distanceKm: 8,
        delayCount: 1,
        delayMinutes: 25,
        routes: [{
          vehicleId: route.vehicleId,
          driverName: route.driverName,
          completed: 1,
          pending: 1,
          distanceKm: 8,
          durationMinutes: 69,
        }],
      })
      assert.deepEqual(await (await fetch(`${base}/plans?date=2026-11-02`)).json(), [])
      assert.equal(await (await fetch(`${base}/analytics?date=2026-11-02`)).json(), null)
      assert.equal((await fetch(`${base}/analytics?date=2026-02-30`)).status, 400)
    } finally {
      await new Promise((resolve) => server.close(resolve))
      db.close()
    }
    const reopened = openDatabase(filename)
    try {
      assert.deepEqual(reopened.plans.latest(date), revised)
    } finally {
      reopened.close()
    }
    const sql = new DatabaseSync(filename, { readOnly: true })
    try {
      assert.deepEqual(sql.prepare("SELECT type, at FROM delivery_events ORDER BY id").all().map(({ type, at }) => [type, at]), [
        ["delivered", "09:22"], ["delay", "09:47"],
      ])
    } finally {
      sql.close()
    }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
