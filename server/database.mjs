import { DatabaseSync } from "node:sqlite"
import { createFleetTables, prepareFleet } from "./fleet.mjs"
import { createOrdersTable, prepareOrders } from "./orders.mjs"
import { createPlansTable, preparePlans } from "./plans.mjs"

export function openDatabase(filename) {
  const db = new DatabaseSync(filename)
  db.exec("PRAGMA busy_timeout = 5000")
  db.exec("BEGIN IMMEDIATE")
  try {
    const { user_version: version } = db.prepare("PRAGMA user_version").get()
    if (version < 1) createOrdersTable(db)
    if (version < 2) createFleetTables(db)
    if (version < 3) createPlansTable(db)
    if (version < 3) db.exec("PRAGMA user_version = 3")
    db.exec("COMMIT")
  } catch (error) {
    db.exec("ROLLBACK")
    db.close()
    throw error
  }
  return { orders: prepareOrders(db), fleet: prepareFleet(db), plans: preparePlans(db), close: () => db.close() }
}
