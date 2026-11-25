import type { Driver, Order, Vehicle } from "./data"

export type OrderDraft = Pick<Order,
  "customer" | "address" | "date" | "priority" | "windowStart" | "windowEnd" |
  "parcelCount" | "loadValue" | "serviceMinutes"
> & { coordinates?: string | null }

export type DriverDraft = Pick<Driver, "name" | "phone" | "shiftStart" | "shiftEnd">
export type VehicleDraft = Pick<Vehicle, "type" | "capacity" | "driverId"> & {
  registration: string
}

export type TravelMode = "demo" | "road" | "coordinates"
export type PlannerStrategy = "greedy" | "graph"

export type RoutePlan = {
  id: number
  date: string
  createdAt: string
  method: string
  travelSource: string
  travelMode?: TravelMode
  comparison?: { method: string, assigned: number, distanceKm: number }[]
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
      coordinates?: [number, number]
    }[]
  }[]
  unassigned: { orderId: string, address: string, reason: string }[]
}

export type PlanAnalytics = {
  planId: number
  travelMode: TravelMode
  orderCount: number
  completed: number
  pending: number
  unassigned: number
  distanceKm: number
  delayCount: number
  delayMinutes: number
  routes: {
    vehicleId: string
    driverName: string
    completed: number
    pending: number
    distanceKm: number
    durationMinutes: number
  }[]
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

export function listPlans(date: string, signal: AbortSignal) {
  return request<RoutePlan[]>(`/api/plans?date=${encodeURIComponent(date)}`, { signal })
}

export function getAnalytics(date: string, signal: AbortSignal) {
  return request<PlanAnalytics | null>(`/api/analytics?date=${encodeURIComponent(date)}`, { signal })
}

export function generatePlan(date: string, strategy: PlannerStrategy, travelMode: Exclude<TravelMode, "demo">) {
  return post<RoutePlan>("/api/plans", { date, travelMode, strategy })
}

export type DeliveryUpdate =
  | { type: "delivered", orderId: string, at: string }
  | { type: "delay", minutes: number }

export function recordDeliveryEvent(date: string, planId: number, vehicleId: string, event: DeliveryUpdate) {
  return post<RoutePlan>("/api/delivery-events", { date, planId, vehicleId, ...event })
}

export type CustomerTrackingStatus = {
  orderId: string
  date: string
  window: string
  status: "Awaiting scheduling" | "Scheduled" | "Delivered"
  eta: string | null
  completedAt: string | null
}

export function createTrackingLink(id: string) {
  return post<{ token: string }>(`/api/orders/${encodeURIComponent(id)}/tracking-link`, {})
}

export function getCustomerTracking(token: string, signal: AbortSignal) {
  return request<CustomerTrackingStatus>(`/api/customer-tracking/${encodeURIComponent(token)}`, { signal })
}
