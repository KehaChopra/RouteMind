# RouteMind Logistics Dashboard

RouteMind is a logistics operations dashboard prototype for planning daily deliveries and keeping track of orders, routes, vehicles, and exceptions. It is built with React, TypeScript, Vite, and Tailwind CSS v4, and is configured to run in Figma Make.

## Features

- **Overview:** At-a-glance delivery metrics, active routes, recent orders, and alerts.
- **Route planner:** Generate and save a dated plan with vehicle assignments, stop sequences, arrival estimates, and unassigned orders.
- **Orders:** Browse and filter orders, inspect order details, and add an order.
- **Fleet:** Review vehicle and driver information and add fleet entries.
- **Live Tracking:** Mark the next stop delivered and record delays against the saved plan.
- **Analytics and history:** Review saved plan versions, compare changes after delays, and see delivery outcomes and reported delay totals.
- **Customer status:** Create an order-specific link that shows scheduling status, ETA, and completion time.

Orders, fleet records, generated plans, and delivery events are stored through an Express API in SQLite. A new database starts empty. The Overview shows totals from saved records and plans.

## Getting started

### Requirements

- Node.js 22.18 or newer in the 22.x series
- pnpm 10.34.3 (the repository pins this with Mise)

### Install and run

```bash
pnpm install
pnpm dev:api
```

In a second terminal from the same directory, start the dashboard:

```bash
pnpm dev
```

The API listens on port 3001. Vite proxies `/api` to it. Orders and fleet records are stored in `.route-mind/orders.sqlite` by default. Set `ROUTEMIND_DB` to use a different database file.

Vite prints the local development URL when the server starts. To create and preview a production build:

```bash
pnpm build
pnpm preview
```

Keep the API running while using the preview. Run `pnpm test` to check API validation, assignments, routing constraints, and persistence across restarts.

## Create your first route plan

1. Set `ROUTEMIND_DEPOT_COORDINATES` to the depot’s longitude and latitude, separated by a comma, before starting the API. In PowerShell, run `$env:ROUTEMIND_DEPOT_COORDINATES = Read-Host "Depot longitude, latitude"` and enter the coordinates when prompted.
2. Add a driver in **Drivers & Vehicles**, then add a vehicle and select that driver. Add orders for the same date.
3. Open **Route Planner** and choose a travel mode. **Coordinate estimates** uses the coordinates you entered on each order and estimates straight-line travel at 30 km/h. It works without a provider account or internet access. **Road routing** requires the configuration below.
4. Click **Optimize Routes**. Select a vehicle to see stops, estimated arrival times, and load. Use **Show stop map** to see an individual stop on OpenStreetMap when internet access is available.

The planner checks total vehicle load, time windows for starting delivery service, service durations, and return to the depot before the shift ends. Oversized orders and other scheduling exceptions appear under **Unassigned orders** with an explanation.

## Use road travel estimates

1. Get an [openrouteservice API key](https://account.heigit.org/). Set `ROUTEMIND_ORS_KEY` in the environment of the API process. Keep the key in the API environment.
2. Set `ROUTEMIND_DEPOT_COORDINATES` to the depot’s longitude and latitude, separated by a comma. Restart the API with both variables set.
3. Add orders with full addresses, including the street, city, and postal code where available. Select **Road routing** in **Route Planner**, then click **Optimize Routes**. Test with public locations for the course demo. Road mode sends order addresses and coordinates to the routing provider.

Road mode estimates driving distance and duration for up to 20 distinct addresses per plan using the driving-car profile. The planner explains unresolved addresses or missing routes. The initial travel matrix is saved for delivery updates. © openrouteservice.org by HeiGIT · Map data © OpenStreetMap contributors.

## Try replanning after a delay

1. Generate a plan, then open **Live Tracking** for the same date.
2. Enter the next stop’s completion time and click **Mark next stop delivered**. The order becomes **Delivered** on the Orders screen.
3. Report a delay and compare the remaining ETAs and the unassigned list. Each update saves a new plan version that preserves completed stops and their recorded times.

Replanning uses the depot or the last completed stop as the driver’s location. It adds delays to the last recorded time or the shift start. Pending deliveries stay on their original vehicle in the same relative order. Stops that can no longer fit go to the unassigned list.

## Customer status

Open an order and click **Get tracking link**. The order-specific link shows the scheduled window, latest estimated arrival, and actual completion time once delivered. It omits names, addresses, and fleet details. Use it on the same local server for the evaluation. Deployment for external customers needs a reachable host and operator authentication.

## Compare planning methods

**Greedy insertion** prioritizes orders and tries the least-distance feasible insertion. **GNN-assisted insertion** uses a small learned graph layer to rank orders within each priority according to likely scheduling conflicts. Both methods use the same constraint checks. The comparison table uses identical inputs and travel times. Distance is for assigned deliveries, so compare the assigned counts alongside distance.

Run `npm run evaluate:planner` for the reproducible benchmark of 40 held-out synthetic scenarios. The model learns on a separate set of synthetic scenarios. MIDEA integration remains pending until the intended package and interface are identified.

## Review history and analytics

Open **Optimization History** for the same planning date and view the delay run. Its details show which ETAs or outcomes changed compared with the preceding saved plan, along with the saved stops and unassigned reasons.

Open **Analytics** for that date to see completed, pending, and unassigned orders in the latest saved plan. The delay total comes from recorded driver events. Distance and duration come from the travel estimates used to generate that plan.

To format the project with the configured formatter:

```bash
pnpm format
```

## Project structure

```text
.
├── .figma/make/       # Figma Make scripts and project configuration
├── public/             # Static assets
├── src/
│   ├── App.tsx         # Dashboard pages and interactions
│   ├── data.ts         # Order and fleet types
│   ├── index.css       # Tailwind import and application styles
│   └── main.tsx        # React entry point
├── index.html
├── package.json
└── vite.config.ts
```

## Tech stack

- React 19 and React DOM
- TypeScript 5.7
- Vite 8
- Tailwind CSS v4
- oxfmt
