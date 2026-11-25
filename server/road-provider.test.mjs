import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { openDatabase } from "./database.mjs"
import { createRoadProvider } from "./road-provider.mjs"

test("road planning uses provider estimates and reuses the saved matrix after restart", async () => {
  const directory = mkdtempSync(join(tmpdir(), "route-mind-road-test-"))
  const filename = join(directory, "orders.sqlite")
  const date = "2026-11-01"
  const addresses = new Map([
    ["First public library", [11, 20]],
    ["Second public library", [12, 20]],
    ["Disconnected public library", [13, 20]],
  ])
  const times = [[0, 481, 600], [420, 0, 420], [720, 480, 0]]
  const distances = [[0, 4.2, 5.5], [3.1, 0, 2.6], [6.3, 4.8, 0]]
  let matrixCalls = 0
  const roadProvider = createRoadProvider({
    apiKey: "test-key",
    depot: "10,20",
    fetcher: async (url, options) => {
      assert.equal(url.hostname, "api.heigit.org")
      if (url.pathname === "/pelias/v1/search") {
        assert.equal(url.searchParams.get("api_key"), "test-key")
        const coordinates = addresses.get(url.searchParams.get("text"))
        return Response.json({ features: coordinates ? [{ geometry: { coordinates } }] : [] })
      }
      assert.equal(url.pathname, "/openrouteservice/v2/matrix/driving-car")
      assert.equal(options.headers.Authorization, "test-key")
      const body = JSON.parse(options.body)
      assert.deepEqual(body.locations[0], [10, 20])
      assert.equal(body.units, "km")
      assert.deepEqual(body.metrics, ["distance", "duration"])
      const indexes = body.locations.map(([lon]) => lon - 10)
      const matrix = (values) => indexes.map((from) => indexes.map((to) => values[from]?.[to] ?? null))
      matrixCalls++
      return Response.json({ distances: matrix(distances), durations: matrix(times) })
    },
  })

  try {
    let initial
    let first
    let second
    const db = openDatabase(filename, { roadProvider })
    try {
      const draft = {
        customer: "Demo", date, priority: "Standard", parcelCount: 1,
        loadValue: 5, serviceMinutes: 10, windowStart: "09:00", windowEnd: "09:25",
      }
      first = db.orders.create({ ...draft, address: "First public library" })
      second = db.orders.create({ ...draft, address: "Second public library", windowStart: "09:20", windowEnd: "10:30" })
      const unknown = db.orders.create({ ...draft, address: "Unresolved address" })
      const disconnected = db.orders.create({ ...draft, address: "Disconnected public library" })
      const result = await db.delivery.generate(date, "road")
      assert.equal(result.status, 201)
      initial = result.plan
      assert.equal(initial.travelMode, "road")
      const [route] = initial.routes
      assert.deepEqual(route.stops.map(({ orderId, eta }) => [orderId, eta]), [[first.id, "09:09"], [second.id, "09:26"]])
      assert.equal(route.distanceKm, 13.1)
      assert.match(initial.unassigned.find(({ orderId }) => orderId === unknown.id).reason, /could not locate/)
      assert.match(initial.unassigned.find(({ orderId }) => orderId === disconnected.id).reason, /No road route/)
    } finally {
      db.close()
    }

    const reopened = openDatabase(filename)
    try {
      const vehicleId = initial.routes[0].vehicleId
      const completion = reopened.delivery.record({
        date, planId: initial.id, vehicleId, type: "delivered", orderId: first.id, at: "09:19",
      })
      assert.equal(completion.status, 201)
      const delay = reopened.delivery.record({ date, planId: completion.plan.id, vehicleId, type: "delay", minutes: 15 })
      assert.equal(delay.status, 201)
      assert.deepEqual(delay.plan.routes[0].stops.map(({ orderId, eta, completedAt }) => [orderId, eta, completedAt]), [
        [first.id, "09:09", "09:19"], [second.id, "09:41", undefined],
      ])
      assert.equal(delay.plan.travelMode, "road")
      assert.equal(reopened.plans.analytics(date).travelMode, "road")
      assert.equal(matrixCalls, 1)
    } finally {
      reopened.close()
    }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test("provider failures and concurrent order changes do not save a partial plan", async () => {
  const unavailable = createRoadProvider({
    apiKey: "test-key", depot: "10,20",
    fetcher: async () => new Response(null, { status: 429 }),
  })
  assert.equal((await unavailable(["A public library"])).status, 502)
  assert.equal((await createRoadProvider({})([])).status, 503)

  const db = openDatabase(":memory:", {
    roadProvider: async () => ({ snapshot: { addresses: [], legs: [[[0, 0]]] } }),
  })
  try {
    const date = "2026-11-01"
    const pending = db.delivery.generate(date, "road")
    db.orders.create({
      customer: "Demo", address: "Public library", date, priority: "Standard",
      parcelCount: 1, loadValue: 5, serviceMinutes: 10, windowStart: "09:00", windowEnd: "09:25",
    })
    assert.equal((await pending).status, 409)
    assert.equal(db.plans.latest(date), null)
    assert.equal((await db.delivery.generate(date, "demo")).status, 201)
  } finally {
    db.close()
  }
})
