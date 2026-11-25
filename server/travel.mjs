// Demo grid in kilometers relative to the depot. The same grid is used for every run.
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

export const depot = [0, 0]

export function findLocation(address) {
  return locations.get(address.trim().toLowerCase().replace(/\s+/g, " "))
}

export function travelLeg(from, to) {
  const distanceKm = Math.abs(from[0] - to[0]) + Math.abs(from[1] - to[1])
  return { distanceKm, minutes: distanceKm * 3 }
}
