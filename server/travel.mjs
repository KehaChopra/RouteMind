import { parseCoordinates } from "./validation.mjs"

// Legacy plan compatibility and automated tests.
const locations = new Map([
  ["18 central market, sector 17", [1, 2]],
  ["42 riverside road", [2, 4]],
  ["7 ashok lane, west end", [-3, 1]],
  ["31 garden avenue", [-2, 3]],
  ["114 mill street", [3, 1]],
  ["5 northfield square", [0, 5]],
  ["88 lakeview crescent", [3, 5]],
  ["16 industrial estate", [4, -3]],
  ["55 holland park road", [-3, -4]],
])

export function addressKey(address) {
  return address.trim().toLowerCase().replace(/\s+/g, " ")
}

export const demoTravel = {
  depot: [0, 0],
  source: "Demo travel estimates",
  missingAddress: "This address is outside the demo travel data.",
  find: (address) => locations.get(addressKey(address)),
  leg: (from, to) => {
    const distanceKm = Math.abs(from[0] - to[0]) + Math.abs(from[1] - to[1])
    return { distanceKm, minutes: distanceKm * 3 }
  },
}

export const roadSource = "openrouteservice road estimates"

export function matrixTravel(snapshot, mode) {
  const indexes = new Map(snapshot.addresses.map((address, index) => [address, index + 1]))
  return {
    depot: 0,
    source: mode === "road" ? roadSource : "Straight-line travel estimates",
    missingAddress: mode === "road"
      ? "The routing provider could not locate this address. Enter a full street address."
      : "This order needs longitude and latitude for coordinate planning.",
    find: (address) => indexes.get(addressKey(address)),
    coordinates: (id) => snapshot.locations?.[id],
    leg: (from, to) => {
      const leg = snapshot.legs[from]?.[to]
      return leg ? { distanceKm: leg[0], minutes: leg[1] } : null
    },
  }
}

export function coordinateSnapshot(depotCoordinates, orders) {
  const depot = parseCoordinates(depotCoordinates)
  if (!depot) return { status: 503, error: "Set the depot coordinates before using coordinate planning. See the README." }
  const addresses = new Map()
  for (const order of orders) {
    const point = parseCoordinates(order.coordinates)
    if (!point) continue
    const key = addressKey(order.address)
    const existing = addresses.get(key)
    if (existing && existing.some((value, index) => value !== point[index])) {
      return { status: 422, error: "Orders with the same delivery address have different coordinates." }
    }
    addresses.set(key, point)
  }
  const locations = [depot, ...addresses.values()]
  if (locations.length > 51) return { status: 422, error: "Coordinate planning supports up to 50 delivery locations per run." }
  const radians = Math.PI / 180
  const legs = locations.map(([lon, lat]) => locations.map(([otherLon, otherLat]) => {
    const separation = Math.sin((otherLat - lat) * radians / 2) ** 2 +
      Math.cos(lat * radians) * Math.cos(otherLat * radians) * Math.sin((otherLon - lon) * radians / 2) ** 2
    const km = 12742 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, separation))))
    return [km, Math.ceil(km * 2)]
  }))
  return { snapshot: { addresses: [...addresses.keys()], locations, legs } }
}
