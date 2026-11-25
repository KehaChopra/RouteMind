import { initialOrders } from "../src/data.ts"
import { isDate, isTime } from "./validation.mjs"

export function validateOrder(input) {
  if (!input || typeof input !== "object") return "Order details are required."
  const { customer, address, date, priority, windowStart, windowEnd, parcelCount, loadValue, serviceMinutes } = input
  if (typeof customer !== "string" || !customer.trim() || customer.length > 120) return "Enter a customer name of up to 120 characters."
  if (typeof address !== "string" || !address.trim() || address.length > 300) return "Enter a delivery address of up to 300 characters."
  if (!isDate(date)) return "Enter a valid delivery date."
  if (!["Standard", "High", "Low"].includes(priority)) return "Select a valid priority."
  if (!isTime(windowStart) || !isTime(windowEnd) || windowStart >= windowEnd) return "The delivery window must end after it starts."
  if (!Number.isSafeInteger(parcelCount) || parcelCount < 1) return "Enter a whole number of parcels greater than zero."
  if (!Number.isFinite(loadValue) || loadValue <= 0) return "Enter a total weight greater than zero."
  if (!Number.isSafeInteger(serviceMinutes) || serviceMinutes < 1 || serviceMinutes > 1440) return "Enter a service time from 1 to 1440 minutes."
  return null
}

function toOrder(row) {
  const { id, ...details } = row
  return {
    ...details,
    id: `RM-${id}`,
    window: `${row.windowStart}–${row.windowEnd}`,
    service: `${row.serviceMinutes} min`,
    load: row.parcelCount === 1 ? "1 parcel" : `${row.parcelCount} parcels`,
  }
}

const insertSql = `INSERT INTO orders (
  id, customer, address, date, priority, windowStart, windowEnd, parcelCount,
  loadValue, serviceMinutes, driver, status
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`

export function createOrdersTable(db) {
  db.exec(`
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer TEXT NOT NULL,
      address TEXT NOT NULL,
      date TEXT NOT NULL,
      priority TEXT NOT NULL,
      windowStart TEXT NOT NULL,
      windowEnd TEXT NOT NULL,
      parcelCount INTEGER NOT NULL,
      loadValue REAL NOT NULL,
      serviceMinutes INTEGER NOT NULL,
      driver TEXT NOT NULL,
      status TEXT NOT NULL
    ) STRICT
  `)
  const insert = db.prepare(insertSql)
  for (const order of initialOrders) {
    insert.get(
      Number(order.id.slice(3)), order.customer, order.address, order.date,
      order.priority, order.windowStart, order.windowEnd, order.parcelCount,
      order.loadValue, order.serviceMinutes, order.driver, order.status,
    )
  }
}

export function prepareOrders(db) {
  const list = db.prepare("SELECT * FROM orders ORDER BY id DESC")
  const insert = db.prepare(insertSql)
  return {
    list: () => list.all().map(toOrder),
    create: (input) => toOrder(insert.get(
      null, input.customer.trim(), input.address.trim(), input.date, input.priority,
      input.windowStart, input.windowEnd, input.parcelCount, input.loadValue,
      input.serviceMinutes, "Unassigned", "Unassigned",
    )),
  }
}
