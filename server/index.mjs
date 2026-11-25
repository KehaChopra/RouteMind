import { mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { createApp } from "./app.mjs"
import { openDatabase } from "./database.mjs"
import { createRoadProvider } from "./road-provider.mjs"

const filename = resolve(process.env.ROUTEMIND_DB ?? ".route-mind/orders.sqlite")
mkdirSync(dirname(filename), { recursive: true })
const database = openDatabase(filename, {
  depotCoordinates: process.env.ROUTEMIND_DEPOT_COORDINATES,
  roadProvider: createRoadProvider({
    apiKey: process.env.ROUTEMIND_ORS_KEY,
    depot: process.env.ROUTEMIND_DEPOT_COORDINATES,
  }),
})
const port = Number(process.env.ROUTEMIND_API_PORT ?? 3001)
createApp(database).listen(port, "127.0.0.1", () => {
  console.log(`RouteMind API listening on http://127.0.0.1:${port}`)
})
