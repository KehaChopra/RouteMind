import { isTime } from "./validation.mjs"

const insertDriver = `INSERT INTO drivers (
  id, name, initials, status, route, assigned, completed, shiftStart, shiftEnd, phone, email, eta
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
const insertVehicle = `INSERT INTO vehicles (id, type, capacity, load, status, driverId, operational)
VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING RETURNING id`

export function createFleetTables(db) {
  db.exec(`
    CREATE TABLE drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      initials TEXT NOT NULL,
      status TEXT NOT NULL,
      route TEXT NOT NULL,
      assigned INTEGER NOT NULL,
      completed INTEGER NOT NULL,
      shiftStart TEXT NOT NULL,
      shiftEnd TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      eta TEXT NOT NULL
    ) STRICT;
    CREATE TABLE vehicles (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      capacity REAL NOT NULL,
      load REAL NOT NULL,
      status TEXT NOT NULL,
      driverId INTEGER UNIQUE REFERENCES drivers (id),
      operational TEXT NOT NULL
    ) STRICT;
  `)
}

export function validateDriver(input) {
  if (!input || typeof input !== "object") return "Driver details are required."
  const { name, phone, shiftStart, shiftEnd } = input
  if (typeof name !== "string" || !name.trim() || name.length > 120) return "Enter a driver name of up to 120 characters."
  if (typeof phone !== "string" || phone.length > 40) return "Enter a phone number of up to 40 characters."
  if (!isTime(shiftStart) || !isTime(shiftEnd) || shiftStart >= shiftEnd) return "The shift must end after it starts."
  return null
}

export function validateVehicle(input) {
  if (!input || typeof input !== "object") return "Vehicle details are required."
  const { registration, type, capacity, driverId } = input
  if (typeof registration !== "string" || !/^[a-z0-9][a-z0-9 -]{0,23}$/i.test(registration.trim())) return "Enter a vehicle registration of up to 24 letters, digits, spaces or hyphens."
  if (!["Delivery van", "Mini truck", "Mini van"].includes(type)) return "Select a valid vehicle type."
  if (!Number.isFinite(capacity) || capacity <= 0) return "Enter a maximum vehicle load greater than zero."
  if (driverId !== null && (typeof driverId !== "string" || !/^DRV-\d+$/.test(driverId) || !Number.isSafeInteger(Number(driverId.slice(4))))) return "Select a valid driver."
  return null
}

function driverId(id) {
  return `DRV-${String(id).padStart(2, "0")}`
}

function toDriver(row) {
  return { ...row, id: driverId(row.id), shift: `${row.shiftStart}–${row.shiftEnd}` }
}

function toVehicle(row) {
  return { ...row, driverId: row.driverId === null ? null : driverId(row.driverId) }
}

export function prepareFleet(db) {
  const listDrivers = db.prepare("SELECT * FROM drivers ORDER BY id")
  const findDriver = db.prepare("SELECT id FROM drivers WHERE id = ?")
  const addDriver = db.prepare(insertDriver)
  const addVehicle = db.prepare(insertVehicle)
  const vehiclesSql = `SELECT vehicles.*, COALESCE(drivers.name, 'Unassigned') AS driver
    FROM vehicles LEFT JOIN drivers ON drivers.id = vehicles.driverId`
  const listVehicles = db.prepare(`${vehiclesSql} ORDER BY vehicles.rowid`)
  const findVehicle = db.prepare(`${vehiclesSql} WHERE vehicles.id = ?`)
  return {
    list: () => ({
      drivers: listDrivers.all().map(toDriver),
      vehicles: listVehicles.all().map(toVehicle),
    }),
    createDriver: (input) => {
      const name = input.name.trim()
      const initials = name.split(/\s+/).slice(0, 2).map((part) => [...part][0]).join("").toUpperCase()
      return toDriver(addDriver.get(
        null, name, initials, "Available", "Not assigned", 0, 0, input.shiftStart,
        input.shiftEnd, input.phone.trim(), "", "—",
      ))
    },
    createVehicle: (input) => {
      const driver = input.driverId === null ? null : Number(input.driverId.slice(4))
      if (driver !== null && !findDriver.get(driver)) {
        return { status: 400, error: "The selected driver does not exist." }
      }
      const registration = input.registration.trim().toUpperCase()
      const result = addVehicle.get(registration, input.type, input.capacity, 0, "Available", driver, "Ready")
      if (!result) {
        return { status: 409, error: "That registration or driver is already assigned to a vehicle." }
      }
      return { status: 201, vehicle: toVehicle(findVehicle.get(result.id)) }
    },
  }
}
