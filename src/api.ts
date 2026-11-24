import type { Order } from "./data"

export type OrderDraft = Pick<Order,
  "customer" | "address" | "date" | "priority" | "windowStart" | "windowEnd" |
  "parcelCount" | "loadValue" | "serviceMinutes"
>

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
  return request<Order>("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  })
}
