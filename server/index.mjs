import { mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { createApp } from "./app.mjs"
import { openOrders } from "./orders.mjs"

const filename = resolve(process.env.ROUTEMIND_DB ?? ".route-mind/orders.sqlite")
mkdirSync(dirname(filename), { recursive: true })
const orders = openOrders(filename)
const port = Number(process.env.ROUTEMIND_API_PORT ?? 3001)
createApp(orders).listen(port, "127.0.0.1", () => {
  console.log(`RouteMind API listening on http://127.0.0.1:${port}`)
})
