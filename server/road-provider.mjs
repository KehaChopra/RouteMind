import { addressKey } from "./travel.mjs"

const origin = "https://api.heigit.org"
const maxAddresses = 20

function validPoint(point) {
  return Array.isArray(point) && point.length === 2 &&
    point.every(Number.isFinite) && Math.abs(point[0]) <= 180 && Math.abs(point[1]) <= 90
}

function parseDepot(text) {
  const parts = text?.split(",").map((part) => part.trim())
  return parts?.every(Boolean) ? parts.map(Number) : null
}

function square(values, size) {
  return Array.isArray(values) && values.length === size &&
    values.every((row) => Array.isArray(row) && row.length === size &&
      row.every((value) => value === null || (Number.isFinite(value) && value >= 0)))
}

export function createRoadProvider({ apiKey, depot, fetcher = fetch }) {
  const point = parseDepot(depot)
  return async (addresses) => {
    if (!apiKey?.trim() || !validPoint(point)) {
      return { status: 503, error: "Road routing needs a server API key and depot coordinates. Choose Demo grid or follow the README setup." }
    }
    const unique = new Map(addresses.map((address) => [addressKey(address), address.trim()]))
    if (unique.size > maxAddresses) {
      return { status: 422, error: `Road routing supports up to ${maxAddresses} distinct delivery addresses per plan.` }
    }

    const signal = AbortSignal.timeout(15000)
    const resolved = []
    try {
      const lookups = [...unique]
      for (let offset = 0; offset < lookups.length; offset += 4) {
        const batch = await Promise.all(lookups.slice(offset, offset + 4).map(async ([key, address]) => {
          const url = new URL("/pelias/v1/search", origin)
          url.search = new URLSearchParams({
            api_key: apiKey.trim(),
            text: address,
            layers: "address,venue",
            size: "1",
            "focus.point.lon": String(point[0]),
            "focus.point.lat": String(point[1]),
          })
          const response = await fetcher(url, { signal })
          if (!response.ok) throw new Error("Geocoding failed")
          const { features } = await response.json()
          if (!Array.isArray(features)) throw new Error("Invalid geocoding response")
          const coordinates = features[0]?.geometry?.coordinates
          return validPoint(coordinates) ? [key, coordinates] : null
        }))
        resolved.push(...batch.filter(Boolean))
      }
      if (!resolved.length) return { snapshot: { addresses: [], legs: [[[0, 0]]] } }

      const locations = [point, ...resolved.map(([, coordinates]) => coordinates)]
      const response = await fetcher(new URL("/openrouteservice/v2/matrix/driving-car", origin), {
        method: "POST",
        headers: { Authorization: apiKey.trim(), "Content-Type": "application/json" },
        body: JSON.stringify({ locations, metrics: ["distance", "duration"], units: "km" }),
        signal,
      })
      if (!response.ok) throw new Error("Routing failed")
      const { distances, durations } = await response.json()
      if (!square(distances, locations.length) || !square(durations, locations.length)) {
        throw new Error("Invalid routing matrix")
      }
      const legs = distances.map((row, from) => row.map((distance, to) => {
        const seconds = durations[from][to]
        return distance === null || seconds === null ? null : [distance, Math.ceil(seconds / 60)]
      }))
      return { snapshot: { addresses: resolved.map(([address]) => address), legs } }
    } catch {
      return { status: 502, error: "Road travel estimates are temporarily unavailable. Try again or select Demo grid." }
    }
  }
}
