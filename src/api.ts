import type { Driver, Order, Vehicle } from "./data"

export type OrderDraft = Pick<Order,
  "customer" | "address" | "date" | "priority" | "windowStart" | "windowEnd" |
  "parcelCount" | "loadValue" | "serviceMinutes"
>

export type DriverDraft = Pick<Driver, "name" | "phone" | "shiftStart" | "shiftEnd">
export type VehicleDraft = Pick<Vehicle, "type" | "capacity" | "driverId"> & {
  registration: string
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new Error("The RouteMind API is unavailable.")
  }

  const result = await response.json()
  if (!response.ok) throw new Error(result.error ?? "The request failed.")
  return result
}

export function listOrders(signal: AbortSignal) {
  return request<Order[]>("/api/orders", { signal })
}

export function createOrder(order: OrderDraft) {
  return post<Order>("/api/orders", order)
}

function post<T>(url: string, input: object) {
  return request<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
}

export function listFleet(signal: AbortSignal) {
  return request<{ drivers: Driver[], vehicles: Vehicle[] }>("/api/fleet", { signal })
}

export function createDriver(driver: DriverDraft) {
  return post<Driver>("/api/drivers", driver)
}

export function createVehicle(vehicle: VehicleDraft) {
  return post<Vehicle>("/api/vehicles", vehicle)
}
