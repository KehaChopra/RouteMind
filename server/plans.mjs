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
  const insert = db.prepare("INSERT INTO plans (date, createdAt, result) VALUES (?, ?, ?) RETURNING *")
  return {
    latest: (date) => toPlan(latest.get(date)),
    save: (plan) => toPlan(insert.get(plan.date, new Date().toISOString(), JSON.stringify(plan))),
  }
}
