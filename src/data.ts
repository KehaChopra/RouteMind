export type Order = {
  id: string
  customer: string
  address: string
  coordinates: string | null
  window: string
  windowStart: string
  windowEnd: string
  priority: "High" | "Standard" | "Low"
  load: string
  loadValue: number
  driver: string
  status: "Delivered" | "In transit" | "Scheduled" | "Unassigned" | "Exception"
  service: string
  serviceMinutes: number
  parcelCount: number
  date: string
}

export type Driver = {
  id: string
  name: string
  initials: string
  status: "Available" | "On route" | "Off shift"
  route: string
  assigned: number
  completed: number
  shift: string
  shiftStart: string
  shiftEnd: string
  phone: string
  email: string
  eta: string
}

export type Vehicle = {
  id: string
  type: string
  capacity: number
  load: number
  status: "In service" | "Available" | "Maintenance"
  driver: string
  driverId: string | null
  operational: string
}
