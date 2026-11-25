const sigmoid = (value) => 1 / (1 + Math.exp(-value))
const dot = (a, b) => a.reduce((total, value, index) => total + value * b[index], 0)

function features(nodes, leg, depot) {
  const own = nodes.map((node) => [
    Math.min(1, (node.end - node.start) / 120),
    Math.min(1, node.end / 1440),
    Math.min(1, node.service / 60),
    Math.min(1, (leg(depot, node.location)?.minutes ?? 120) / 120),
  ])
  return nodes.map((node, index) => {
    const message = [0, 0, 0, 0]
    let total = 0
    for (const [otherIndex, other] of nodes.entries()) {
      if (index === otherIndex) continue
      const connection = leg(node.location, other.location)
      if (!connection) continue
      const weight = 1 / (1 + connection.minutes / 20)
      total += weight
      for (let i = 0; i < message.length; i++) message[i] += weight * own[otherIndex][i]
    }
    return [1, ...own[index], ...message.map((value) => total ? value / total : 0)]
  })
}

export function syntheticScenario(seed) {
  let state = seed >>> 0
  const random = (limit) => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return Math.floor((state / 4294967296) * limit)
  }
  const nodes = Array.from({ length: 8 }, (_, index) => {
    const start = 540 + random(190)
    return {
      id: `O${index + 1}`, location: [random(28) - 14, random(28) - 14],
      start, end: start + 15 + random(85), service: 5 + random(16), load: 10 + random(36),
    }
  })
  return { nodes, depot: [0, 0], leg: syntheticLeg }
}

function syntheticLeg(a, b) {
  const distanceKm = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1])
  return { distanceKm, minutes: distanceKm * 2 }
}

function fitsBefore(a, b, { depot, leg }) {
  const first = Math.max(540 + leg(depot, a.location).minutes, a.start)
  return first <= a.end &&
    Math.max(first + a.service + leg(a.location, b.location).minutes, b.start) <= b.end
}

let weights

function train() {
  const examples = []
  for (let seed = 1; seed <= 96; seed++) {
    const graph = syntheticScenario(seed)
    const inputs = features(graph.nodes, graph.leg, graph.depot)
    for (const [index, node] of graph.nodes.entries()) {
      const others = graph.nodes.filter((other) => other !== node)
      const conflictRate = others.filter((other) => !fitsBefore(node, other, graph) && !fitsBefore(other, node, graph)).length / others.length
      examples.push({ input: inputs[index], target: conflictRate })
    }
  }
  const fitted = Array(9).fill(0)
  for (let epoch = 0; epoch < 30; epoch++) {
    const rate = 0.12 / (1 + epoch / 10)
    for (const { input, target } of examples) {
      const error = sigmoid(dot(fitted, input)) - target
      for (let i = 0; i < fitted.length; i++) fitted[i] -= rate * error * input[i]
    }
  }
  return fitted
}

// One learned graph-convolution layer over each stop and its travel-weighted neighbors.
export function graphScores(nodes, travel) {
  weights ??= train()
  return new Map(features(nodes, travel.leg, travel.depot).map((input, index) => [
    nodes[index].id, sigmoid(dot(weights, input)),
  ]))
}
