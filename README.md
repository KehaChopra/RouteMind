# RouteMind Logistics Dashboard

RouteMind is a logistics operations dashboard prototype for planning daily deliveries and keeping track of orders, routes, vehicles, and exceptions. It is built with React, TypeScript, Vite, and Tailwind CSS v4, and is configured to run in Figma Make.

## Features

- **Overview:** At-a-glance delivery metrics, active routes, recent orders, and alerts.
- **Route planner:** Generate and save a dated plan with vehicle assignments, stop sequences, arrival estimates, and unassigned orders.
- **Orders:** Browse and filter orders, inspect order details, and add an order.
- **Fleet:** Review vehicle and driver information and add fleet entries.
- **Tracking and analytics:** Explore the tracking, reporting, and optimization history views.

Orders, fleet records, and generated plans are stored through an Express API in SQLite. The database starts with demo orders and fleet records. The overview map, tracking, analytics, and Optimization History still use illustrative data.

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

## Try route planning

1. Open **Route Planner**, select **29 October 2026**, and click **Optimize Routes**. The planner considers pending orders and pairs marked **Available**. It skips delivered and in-transit orders.
2. Select a vehicle to see the stop order, ETA, load, and estimated depot return. Refresh the page to reload the latest plan for that date.
3. To test capacity, add an order on that date for **7 Ashok Lane, West End**, with a 10:30–11:00 window and a load of **141 kg**. In the seeded fleet the only available vehicle paired with an available driver can carry 140 kg. Re-run the planner and check the order's reason in **Unassigned orders**.

The greedy insertion planner prioritizes high-priority orders, then earlier deadlines. It checks total vehicle load, time windows for starting delivery service, service durations, and the driver's return to the depot before the shift ends. Travel comes from a fixed demo grid covering the sample addresses. An address outside that grid is reported with a reason. Each run saves a plan snapshot without changing order execution status.

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
│   ├── data.ts         # Sample routes, orders, and fleet data
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
