import express from "express"
import { validateDeliveryEvent } from "./delivery.mjs"
import { validateDriver, validateVehicle } from "./fleet.mjs"
import { validateOrder } from "./orders.mjs"
import { isDate } from "./validation.mjs"

export function createApp({ orders, fleet, plans, delivery }) {
  const app = express()
  app.use(express.json({ limit: "16kb" }))

  app.get("/api/orders", (_request, response) => {
    response.json(orders.list())
  })

  app.post("/api/orders", (request, response) => {
    const error = validateOrder(request.body)
    if (error) return response.status(400).json({ error })
    response.status(201).json(orders.create(request.body))
  })

  app.get("/api/fleet", (_request, response) => response.json(fleet.list()))

  app.post("/api/drivers", (request, response) => {
    const error = validateDriver(request.body)
    if (error) return response.status(400).json({ error })
    response.status(201).json(fleet.createDriver(request.body))
  })

  app.post("/api/vehicles", (request, response) => {
    const error = validateVehicle(request.body)
    if (error) return response.status(400).json({ error })
    const result = fleet.createVehicle(request.body)
    response.status(result.status).json(result.vehicle ?? { error: result.error })
  })

  app.get("/api/plans/latest", (request, response) => {
    const { date } = request.query
    if (!isDate(date)) return response.status(400).json({ error: "Enter a valid planning date." })
    response.json(plans.latest(date))
  })

  app.post("/api/plans", (request, response) => {
    const date = request.body?.date
    if (!isDate(date)) return response.status(400).json({ error: "Enter a valid planning date." })
    const result = delivery.generate(date)
    response.status(result.status).json(result.plan ?? { error: result.error })
  })

  app.post("/api/delivery-events", (request, response) => {
    const error = validateDeliveryEvent(request.body)
    if (error) return response.status(400).json({ error })
    const result = delivery.record(request.body)
    response.status(result.status).json(result.plan ?? { error: result.error })
  })

  app.use("/api", (_request, response) => {
    response.status(404).json({ error: "API endpoint not found." })
  })

  app.use((error, _request, response, _next) => {
    if (error.type === "entity.parse.failed") {
      return response.status(400).json({ error: "Send valid JSON." })
    }
    if (error.type === "entity.too.large") {
      return response.status(413).json({ error: "The request is too large." })
    }
    console.error(error)
    response.status(500).json({ error: "RouteMind could not complete the request." })
  })

  return app
}
