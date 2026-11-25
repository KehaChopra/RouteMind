import { DatabaseSync } from "node:sqlite"
import { createDeliveryEventsTable, prepareDelivery } from "./delivery.mjs"
import { createFleetTables, prepareFleet } from "./fleet.mjs"
import { createOrdersTable, prepareOrders } from "./orders.mjs"
import { createPlansTable, createPlanTravelTable, preparePlans } from "./plans.mjs"

export function openDatabase(filename, { roadProvider } = {}) {
  const db = new DatabaseSync(filename)
  db.exec("PRAGMA busy_timeout = 5000")
  db.exec("BEGIN IMMEDIATE")
  try {
    const { user_version: version } = db.prepare("PRAGMA user_version").get()
    if (version < 1) createOrdersTable(db)
    if (version < 2) createFleetTables(db)
    if (version < 3) createPlansTable(db)
    if (version < 4) createDeliveryEventsTable(db)
    if (version < 5) createPlanTravelTable(db)
    if (version < 5) db.exec("PRAGMA user_version = 5")
    db.exec("COMMIT")
  } catch (error) {
    db.exec("ROLLBACK")
    db.close()
    throw error
  }
  const stores = { orders: prepareOrders(db), fleet: prepareFleet(db), plans: preparePlans(db) }
  return { ...stores, delivery: prepareDelivery(db, stores, roadProvider), close: () => db.close() }
}
