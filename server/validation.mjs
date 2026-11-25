export function isTime(value) {
  return typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export function isDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(value)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function validPoint(point) {
  return Array.isArray(point) && point.length === 2 &&
    point.every(Number.isFinite) && Math.abs(point[0]) <= 180 && Math.abs(point[1]) <= 90
}

export function parseCoordinates(text) {
  if (typeof text !== "string") return null
  const parts = text.split(",").map((part) => part.trim())
  const point = parts.every(Boolean) ? parts.map(Number) : null
  return validPoint(point) ? point : null
}
