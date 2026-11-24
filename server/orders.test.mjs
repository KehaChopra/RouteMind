import assert from "node:assert/strict"
import { once } from "node:events"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { createApp } from "./app.mjs"
import { openOrders } from "./orders.mjs"

test("orders API keeps entered values across restarts and rejects reversed delivery windows", async () => {
  const directory = mkdtempSync(join(tmpdir(), "route-mind-test-"))
  const file = join(directory, "orders.sqlite")
  const input = {
    customer: "Northfield Cafe",
    address: "15 Market Road",
    date: "2026-12-01",
    priority: "High",
    windowStart: "10:00",
    windowEnd: "11:00",
    parcelCount: 3,
    loadValue: 12.5,
    serviceMinutes: 17,
  }
  let id
  try {
    for (const phase of ["create", "reopen"]) {
      const orders = openOrders(file)
      const server = createApp(orders).listen(0, "127.0.0.1")
      try {
        await once(server, "listening")
        const url = `http://127.0.0.1:${server.address().port}/api/orders`
        const post = (payload) => fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const get = async () => {
          const response = await fetch(url)
          assert.equal(response.status, 200)
          return response.json()
        }

        if (phase === "create") {
          const initialCount = (await get()).length
          const invalid = await post({ ...input, windowEnd: "09:00" })
          assert.equal(invalid.status, 400)
          assert.match((await invalid.json()).error, /window/)
          assert.equal((await get()).length, initialCount)

          const response = await post(input)
          assert.equal(response.status, 201)
          const order = await response.json()
          assert.match(order.id, /^RM-\d+$/)
          assert.equal(order.status, "Unassigned")
          id = order.id
          assert.equal((await get()).length, initialCount + 1)
        } else {
          const order = (await get()).find((record) => record.id === id)
          assert.ok(order)
          for (const [key, value] of Object.entries(input)) {
            assert.equal(order[key], value, key)
          }
        }
      } finally {
        await new Promise((resolve) => server.close(resolve))
        orders.close()
      }
    }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
