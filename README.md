# RouteMind Logistics Dashboard

RouteMind is a logistics operations dashboard prototype for planning daily deliveries and keeping track of orders, routes, vehicles, and exceptions. It is built with React, TypeScript, Vite, and Tailwind CSS v4, and is configured to run in Figma Make.

## Features

- **Overview:** At-a-glance delivery metrics, active routes, recent orders, and alerts.
- **Route planner:** Review route options and stop sequences on an illustrative map, then run the prototype optimizer.
- **Orders:** Browse and filter orders, inspect order details, and add an order.
- **Fleet:** Review vehicle and driver information and add fleet entries.
- **Tracking and analytics:** Explore the tracking, reporting, and optimization history views.

The Orders screen reads and creates orders through an Express API and SQLite. The database starts with demo orders. The map, route optimization and remaining dashboard views still use illustrative data.

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

The API listens on port 3001. Vite proxies `/api` to it. Orders are stored in `.route-mind/orders.sqlite` by default. Set `ROUTEMIND_DB` to use a different database file.

Vite prints the local development URL when the server starts. To create and preview a production build:

```bash
pnpm build
pnpm preview
```

Keep the API running while using the preview. Run `pnpm test` to check order creation, validation, and persistence across restarts.

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
