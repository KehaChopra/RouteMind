export function createPlansTable(db) {
  db.exec(`
    CREATE TABLE plans (
      id INTEGER PRIMARY KEY,
      date TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      result TEXT NOT NULL
    ) STRICT;
    CREATE INDEX plans_date_id ON plans (date, id DESC);
  `)
}

function toPlan(row) {
  return row ? { ...JSON.parse(row.result), id: row.id, createdAt: row.createdAt } : null
}

export function preparePlans(db) {
  const latest = db.prepare("SELECT * FROM plans WHERE date = ? ORDER BY id DESC LIMIT 1")
  const list = db.prepare("SELECT * FROM plans WHERE date = ? ORDER BY id DESC")
  const delays = db.prepare(`
    SELECT COUNT(*) AS delayCount, COALESCE(SUM(delivery_events.delayMinutes), 0) AS delayMinutes
    FROM delivery_events JOIN plans ON plans.id = delivery_events.planId
    WHERE plans.date = ? AND plans.id <= ? AND delivery_events.type = 'delay'
  `)
  const insert = db.prepare("INSERT INTO plans (date, createdAt, result) VALUES (?, ?, ?) RETURNING *")
  return {
    latest: (date) => toPlan(latest.get(date)),
    list: (date) => list.all(date).map(toPlan),
    analytics: (date) => {
      const plan = toPlan(latest.get(date))
      if (!plan) return null
      const routes = plan.routes.map((route) => {
        const completed = route.stops.filter((stop) => stop.completedAt).length
        return {
          vehicleId: route.vehicleId,
          driverName: route.driverName,
          completed,
          pending: route.stops.length - completed,
          distanceKm: route.distanceKm,
          durationMinutes: route.durationMinutes,
        }
      })
      return {
        planId: plan.id,
        orderCount: plan.orderCount,
        completed: routes.reduce((sum, route) => sum + route.completed, 0),
        pending: routes.reduce((sum, route) => sum + route.pending, 0),
        unassigned: plan.unassigned.length,
        distanceKm: routes.reduce((sum, route) => sum + route.distanceKm, 0),
        ...delays.get(date, plan.id),
        routes,
      }
    },
    save: (plan) => toPlan(insert.get(plan.date, new Date().toISOString(), JSON.stringify(plan))),
  }
}
