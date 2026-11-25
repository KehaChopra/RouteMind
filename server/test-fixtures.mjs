export function addTestVehicle(db) {
  const driver = db.fleet.createDriver({
    name: "Test Driver", phone: "", shiftStart: "09:00", shiftEnd: "17:00",
  })
  return db.fleet.createVehicle({
    registration: "TEST-140", type: "Delivery van", capacity: 140, driverId: driver.id,
  }).vehicle
}

export function addTestOrder(db, date) {
  return db.orders.create({
    customer: "Test Customer", address: "7 Ashok Lane, West End", date,
    priority: "Standard", parcelCount: 1, loadValue: 5, serviceMinutes: 10,
    windowStart: "09:00", windowEnd: "10:00",
  })
}
