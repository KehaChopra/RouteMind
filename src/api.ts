import type { Driver, Order, Vehicle } from "./data"

export type OrderDraft = Pick<Order,
  "customer" | "address" | "date" | "priority" | "windowStart" | "windowEnd" |
  "parcelCount" | "loadValue" | "serviceMinutes"
>

export type DriverDraft = Pick<Driver, "name" | "phone" | "shiftStart" | "shiftEnd">
export type VehicleDraft = Pick<Vehicle, "type" | "capacity" | "driverId"> & {
  registration: string
}

export type RoutePlan = {
  id: number
  date: string
  method: string
  travelSource: string
  orderCount: number
  previousPlanId?: number
  event?: {
    vehicleId: string
    type: "delivered" | "delay"
    orderId: string | null
    at: string
    delayMinutes: number | null
  }
  routes: {
    vehicleId: string
    driverId: string
    driverName: string
    capacityKg: number
    loadKg: number
    distanceKm: number
    durationMinutes: number
    returnAt: string | null
    readyAt?: string
    stops: {
      orderId: string
      address: string
      eta: string
      window: string
      loadKg: number
      serviceMinutes?: number
      completedAt?: string
    }[]
  }[]
  unassigned: { orderId: string, address: string, reason: string }[]
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

export function getLatestPlan(date: string, signal: AbortSignal) {
  return request<RoutePlan | null>(`/api/plans/latest?date=${encodeURIComponent(date)}`, { signal })
}

export function generatePlan(date: string) {
  return post<RoutePlan>("/api/plans", { date })
}

export type DeliveryUpdate =
  | { type: "delivered", orderId: string, at: string }
  | { type: "delay", minutes: number }

export function recordDeliveryEvent(date: string, planId: number, vehicleId: string, event: DeliveryUpdate) {
  return post<RoutePlan>("/api/delivery-events", { date, planId, vehicleId, ...event })
}
