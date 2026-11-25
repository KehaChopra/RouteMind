import { randomBytes } from "node:crypto"

export function createCustomerTrackingTable(db) {
  db.exec(`
    CREATE TABLE customer_tracking (
      orderId INTEGER PRIMARY KEY REFERENCES orders (id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE
    ) STRICT;
  `)
}

export function prepareCustomerTracking(db, plans) {
  const create = db.prepare(`
    INSERT INTO customer_tracking (orderId, token)
    SELECT id, ? FROM orders WHERE id = ?
    ON CONFLICT (orderId) DO NOTHING
  `)
  const link = db.prepare("SELECT token FROM customer_tracking WHERE orderId = ?")
  const lookup = db.prepare(`
    SELECT orders.id, orders.date, orders.status, orders.windowStart, orders.windowEnd
    FROM customer_tracking JOIN orders ON orders.id = customer_tracking.orderId
    WHERE customer_tracking.token = ?
  `)

  return {
    share: (id) => {
      create.run(randomBytes(24).toString("base64url"), id)
      return link.get(id) ?? null
    },
    status: (token) => {
      const order = lookup.get(token)
      if (!order) return null
      const orderId = `RM-${order.id}`
      const plan = plans.latest(order.date)
      const stop = plan?.routes.flatMap((route) => route.stops).find((item) => item.orderId === orderId)
      const delivered = Boolean(stop?.completedAt || order.status === "Delivered")
      const status = delivered ? "Delivered" : stop ? "Scheduled" : "Awaiting scheduling"
      return {
        orderId, date: order.date, window: `${order.windowStart}–${order.windowEnd}`,
        status, eta: delivered ? null : stop?.eta ?? null, completedAt: stop?.completedAt ?? null,
      }
    },
  }
}
