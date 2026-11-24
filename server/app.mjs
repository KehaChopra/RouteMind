import express from "express"
import { validateOrder } from "./orders.mjs"

export function createApp(orders) {
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
