import assert from "node:assert/strict"
import { once } from "node:events"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { DatabaseSync } from "node:sqlite"
import { test } from "node:test"
import { createApp } from "./app.mjs"
import { openDatabase } from "./database.mjs"
import { createOrdersTable } from "./orders.mjs"

test("fleet API upgrades the orders database and persists driver and vehicle assignments", async () => {
  const directory = mkdtempSync(join(tmpdir(), "route-mind-fleet-test-"))
  const filename = join(directory, "orders.sqlite")
  const driver = { name: "Anita Shah", phone: "+91 98765 12345", shiftStart: "08:15", shiftEnd: "13:30" }
  let driverId
  try {
    const previous = new DatabaseSync(filename)
    try {
      createOrdersTable(previous)
      previous.exec("PRAGMA user_version = 1")
      previous.exec(`
        INSERT INTO orders (customer, address, date, priority, windowStart, windowEnd, parcelCount,
          loadValue, serviceMinutes, driver, status)
        VALUES ('Existing customer', 'Test address', '2026-11-01', 'Standard', '09:00', '10:00',
          1, 5, 10, 'Unassigned', 'Unassigned')
      `)
    } finally {
      previous.close()
    }

    const store = openDatabase(filename)
    const server = createApp(store).listen(0, "127.0.0.1")
    try {
      await once(server, "listening")
      const base = `http://127.0.0.1:${server.address().port}/api`
      const post = (path, body) => fetch(base + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const invalid = await post("/drivers", { ...driver, shiftEnd: "07:00" })
      assert.equal(invalid.status, 400)
      assert.match((await invalid.json()).error, /shift/)

      const created = await post("/drivers", driver)
      assert.equal(created.status, 201)
      driverId = (await created.json()).id
      const vehicle = { registration: "test-van", type: "Mini van", capacity: 42.5, driverId }
      const assigned = await post("/vehicles", vehicle)
      assert.equal(assigned.status, 201)
      assert.equal((await assigned.json()).driver, driver.name)
      const duplicate = await post("/vehicles", { ...vehicle, driverId: null })
      assert.equal(duplicate.status, 409)
      const doubleAssignment = await post("/vehicles", { ...vehicle, registration: "other-van" })
      assert.equal(doubleAssignment.status, 409)
      const fleet = await fetch(base + "/fleet")
      assert.equal(fleet.status, 200)
      assert.ok((await fleet.json()).vehicles.some((record) => record.id === "TEST-VAN"))
    } finally {
      await new Promise((resolve) => server.close(resolve))
      store.close()
    }

    const reopened = openDatabase(filename)
    try {
      const fleet = reopened.fleet.list()
      const savedDriver = fleet.drivers.find((record) => record.id === driverId)
      assert.ok(savedDriver)
      for (const [key, value] of Object.entries(driver)) assert.equal(savedDriver[key], value, key)
      const savedVehicle = fleet.vehicles.find((record) => record.id === "TEST-VAN")
      assert.equal(savedVehicle.capacity, 42.5)
      assert.equal(savedVehicle.driverId, driverId)
      assert.equal(reopened.orders.list()[0].customer, "Existing customer")
    } finally {
      reopened.close()
    }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
