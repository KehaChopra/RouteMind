import { FormEvent, useEffect, useMemo, useState } from "react"
import {
  Driver,
  historyRuns,
  initialDrivers,
  initialOrders,
  initialVehicles,
  Order,
  Route,
  routes,
  Vehicle,
} from "./data"

type Page = "overview" | "planner" | "orders" | "fleet" | "tracking" | "analytics" | "history" | "settings"

type IconName = "analytics" | "bell" | "calendar" | "check" | "chevron" | "clock" | "close" | "download" | "edit" | "fleet" | "history" | "info" | "locate" | "map" | "menu" | "minus" | "orders" | "overview" | "plus" | "route" | "save" | "search" | "settings" | "spark" | "tracking" | "truck" | "user" | "warning"

const paths: Record<IconName, React.ReactNode> = {
  analytics: (
    <>
      <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  download: (
    <>
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 20h16" />
    </>
  ),
  edit: (
    <>
      <path d="m4 20 4.5-1 10-10-3.5-3.5-10 10L4 20Z" />
      <path d="m13.5 7 3.5 3.5" />
    </>
  ),
  fleet: (
    <>
      <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5M12 7v5l3 2" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  locate: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      <circle cx="12" cy="12" r="7" />
    </>
  ),
  map: (
    <>
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
      <path d="M9 3v15M15 6v15" />
    </>
  ),
  menu: <path d="M5 7h14M5 12h14M5 17h14" />,
  minus: <path d="M5 12h14" />,
  orders: (
    <>
      <path d="M6 4h12v17H6zM9 4V2h6v2M9 9h6M9 13h6M9 17h4" />
    </>
  ),
  overview: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  route: (
    <>
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <path d="M8 18h3a3 3 0 0 0 3-3v-1a3 3 0 0 0-3-3H9a3 3 0 0 1-3-3V6M16 6h-3" />
    </>
  ),
  save: (
    <>
      <path d="M4 4h14l2 2v14H4zM8 4v6h8V4M8 20v-6h8v6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.5 1A7 7 0 0 0 15 6l-.4-2.7h-4L10 6a7 7 0 0 0-1.5.9l-2.5-1-2 3.5L6 11a7 7 0 0 0 0 2l-2 1.6L6 18l2.5-1A7 7 0 0 0 10 18l.5 2.7h4L15 18a7 7 0 0 0 1.5-.9l2.5 1 2-3.5-2-1.6a7 7 0 0 0 .1-1Z" />
    </>
  ),
  spark: (
    <>
      <path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z" />
      <path d="m5 13 .8 2.2L8 16l-2.2.8L5 19l-.8-2.2L2 16l2.2-.8L5 13Z" />
    </>
  ),
  tracking: (
    <>
      <circle cx="12" cy="10" r="3" />
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
    </>
  ),
  truck: (
    <>
      <path d="M3 5h11v11H3zM14 9h4l3 3v4h-7z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-5 3-8 8-8s8 3 8 8" />
    </>
  ),
  warning: (
    <>
      <path d="M10.3 3.7 2.6 18a2 2 0 0 0 1.8 3h15.2a2 2 0 0 0 1.8-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
}

function Icon({ name, size = 18 }: { name: IconName size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      {paths[name]}
    </svg>
  )
}

function Button({
  children,
  variant = "secondary",
  onClick,
  type = "button",
  disabled = false,
}: {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "quiet" | "danger"
  onClick?: () => void
  type?: "button" | "submit"
  disabled?: boolean
}) {
  return (
    <button
      className={`btn btn-${variant}`}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  )
}

const pageTitles: Record<Page, string> = {
  overview: "Overview",
  planner: "Route Planner",
  orders: "Orders",
  fleet: "Drivers & Vehicles",
  tracking: "Live Tracking",
  analytics: "Analytics",
  history: "Optimization History",
  settings: "Settings",
}

const navGroups: {
  label: string
  items: { page: Page label: string icon: IconName }[]
}[] = [
  {
    label: "Workspace",
    items: [
      { page: "overview", label: "Overview", icon: "overview" },
      { page: "planner", label: "Route Planner", icon: "route" },
      { page: "orders", label: "Orders", icon: "orders" },
      { page: "fleet", label: "Drivers & Vehicles", icon: "fleet" },
      { page: "tracking", label: "Live Tracking", icon: "tracking" },
      { page: "analytics", label: "Analytics", icon: "analytics" },
    ],
  },
  {
    label: "Management",
    items: [
      { page: "history", label: "Optimization History", icon: "history" },
      { page: "settings", label: "Settings", icon: "settings" },
    ],
  },
]

function Brand() {
  return (
    <div className="brand">
      <svg fill="none" viewBox="0 0 38 38">
        <path d="M9 28c0-6 9-4 9-10 0-4-5-4-5-8" />
        <circle cx="9" cy="29" r="3" />
        <path d="M27 8c-4.4 0-8 3.4-8 7.7 0 5.7 8 13.3 8 13.3s8-7.6 8-13.3C35 11.4 31.4 8 27 8Z" />
        <circle cx="27" cy="15.5" r="2.5" />
      </svg>
      <span>RouteMind</span>
    </div>
  )
}

function Status({ value }: { value: string }) {
  return (
    <span
      className={`status status-${value.toLowerCase().replaceAll(" ", "-")}`}
    >
      <i />
      {value}
    </span>
  )
}

function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle: string
  actions?: React.ReactNode
}) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow">Operations workspace</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  )
}

function Drawer({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="overlay" onMouseDown={onClose}>
      <aside className="drawer" onMouseDown={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            aria-label="Close details"
            className="icon-btn"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  )
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string
  subtitle: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="overlay modal-overlay" onMouseDown={onClose}>
      <section className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button
            aria-label="Close form"
            className="icon-btn"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

const routeGeometry = [
  {
    id: 1,
    d: "M105 354 C160 310 212 297 259 245 S333 163 397 185 S475 235 530 190 S607 112 700 142",
    stops: [
      [105, 354],
      [259, 245],
      [397, 185],
      [530, 190],
      [700, 142],
    ],
  },
  {
    id: 2,
    d: "M105 354 C175 374 232 395 304 350 S392 288 457 310 S573 358 667 305 S733 260 786 270",
    stops: [
      [304, 350],
      [457, 310],
      [667, 305],
      [786, 270],
    ],
  },
  {
    id: 3,
    d: "M105 354 C83 280 92 217 145 180 S245 150 282 105 S345 55 418 78",
    stops: [
      [145, 180],
      [282, 105],
      [418, 78],
    ],
  },
  {
    id: 4,
    d: "M105 354 C178 330 240 295 296 278 S370 236 432 250 S545 280 602 245 S700 190 780 198",
    stops: [
      [296, 278],
      [432, 250],
      [602, 245],
      [780, 198],
    ],
  },
]

function CityMap({
  selectedRoute = 1,
  onSelectRoute,
  tracking = false,
  compact = false,
}: {
  selectedRoute?: number
  onSelectRoute?: (id: number) => void
  tracking?: boolean
  compact?: boolean
}) {
  return (
    <div className={`city-map ${compact ? "compact-map" : ""}`}>
      <svg
        aria-label="Illustrative city delivery route map"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 850 440"
      >
        <rect className="map-bg" width="850" height="440" />
        <path
          className="water"
          d="M750-10c-55 82-30 132 17 192s24 151-55 270h138V-10Z"
        />
        <path className="park" d="M480 35h145l31 82-59 50-131-32Z" />
        <path className="park" d="M24 264h120l51 61-33 96H29Z" />
        <g className="buildings">
          {Array.from({ length: 30 }).map((_, i) => (
            <rect
              key={i}
              x={45 + (i % 6) * 110 + (i % 2) * 12}
              y={30 + Math.floor(i / 6) * 78}
              width={55 + (i % 3) * 11}
              height={30 + (i % 2) * 10}
              rx="3"
            />
          ))}
        </g>
        <g className="minor-streets">
          {[85, 150, 220, 290, 365].map((y) => (
            <path
              d={`M-10 ${y} C190 ${y - 15} 380 ${y + 12} 860 ${y - 5}`}
              key={y}
            />
          ))}
          {[70, 160, 260, 355, 460, 575, 685].map((x) => (
            <path
              d={`M${x} -10 C${x - 15} 130 ${x + 18} 280 ${x + 5} 450`}
              key={x}
            />
          ))}
        </g>
        <g className="major-streets">
          <path d="M-20 280C130 267 210 220 324 217s222 40 336 14 133-50 210-52" />
          <path d="M115-15c42 102 63 170 65 261s-15 127-3 207" />
          <path d="M318-10c16 88 40 148 82 209s91 138 107 252" />
          <path d="M535-10c-4 92-10 168 27 236s87 138 100 218" />
        </g>
        <g className="map-labels">
          <text x="310" y="170">
            CENTRAL MARKET
          </text>
          <text x="632" y="125">
            RIVERSIDE
          </text>
          <text x="70" y="244">
            WEST END
          </text>
          <text x="515" y="68">
            HOLLAND PARK
          </text>
          <text x="500" y="405">
            GARDEN AVENUE
          </text>
        </g>
        <g className="route-lines">
          {routeGeometry.map((route) => (
            <path
              className={`route-path route-${route.id} ${
                selectedRoute === route.id ? "active" : ""
              }`}
              d={route.d}
              key={route.id}
              onClick={() => onSelectRoute?.(route.id)}
            />
          ))}
        </g>
        {routeGeometry.map((route) => (
          <g
            className={`map-stops route-stops-${route.id} ${
              selectedRoute === route.id ? "active" : ""
            }`}
            key={route.id}
          >
            {route.stops.map(([x, y], index) => (
              <g key={`${x}-${y}`}>
                <circle cx={x} cy={y} r="11" />
                <text x={x} y={y + 4}>
                  {index + 1}
                </text>
              </g>
            ))}
          </g>
        ))}
        <g className="depot" transform="translate(105 354)">
          <circle r="17" />
          <path d="M-7 7V-6h14V7M-3 7V1h6v6M-9-6 0-12 9-6" />
        </g>
        {tracking && (
          <g className="vehicle-marker" transform="translate(455 205)">
            <circle r="17" />
            <path d="M-8-4h10l5 5v7H-8ZM2-4V1h5M-4 8v2M4 8v2" />
          </g>
        )}
      </svg>
      <div className="map-overlay-title">
        <span className="map-pulse" />
        <div>
          <strong>
            {tracking
              ? "Simulated route positions"
              : "Today’s delivery network"}
          </strong>
          <small>
            {tracking
              ? "Position data updated for prototype"
              : "24 orders · 4 planned routes"}
          </small>
        </div>
      </div>
      <div className="map-controls">
        <button aria-label="Zoom in">
          <Icon name="plus" size={16} />
        </button>
        <button aria-label="Zoom out">
          <Icon name="minus" size={16} />
        </button>
        <button aria-label="Recenter">
          <Icon name="locate" size={16} />
        </button>
      </div>
      <div className="map-legend">
        {routes.map((route) => (
          <button
            className={selectedRoute === route.id ? "selected" : ""}
            key={route.id}
            onClick={() => onSelectRoute?.(route.id)}
          >
            <i className={`tone-${route.tone}`} />
            {route.label}
          </button>
        ))}
      </div>
      <small className="map-credit">
        Illustrative map data · Prototype positions
      </small>
    </div>
  )
}

function OverviewPage({
  goTo,
  date,
  setDate,
}: {
  goTo: (page: Page) => void
  date: string
  setDate: (date: string) => void
}) {
  return (
    <div className="page">
      <PageHeader
        title="Good morning, Alex"
        subtitle="Here’s what’s happening with your deliveries today."
        actions={
          <>
            <label className="date-control">
              <Icon name="calendar" size={16} />
              <input
                onChange={(e) => setDate(e.target.value)}
                type="date"
                value={date}
              />
            </label>
            <Button onClick={() => goTo("planner")} variant="primary">
              Go to Route Planner <Icon name="chevron" size={16} />
            </Button>
          </>
        }
      />
      <div className="metrics">
        {[
          ["Total Orders", "24", "Scheduled today", "orders"],
          ["Active Routes", "4", "Across 4 drivers", "route"],
          ["Deliveries Completed", "6", "18 remaining", "check"],
          ["Need Attention", "2", "Constraint review", "warning"],
        ].map(([label, value, note, icon], i) => (
          <div
            className={`metric ${i === 3 ? "metric-warning" : ""}`}
            key={label}
          >
            <div className="metric-icon">
              <Icon name={icon as IconName} />
            </div>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{note}</small>
            </div>
          </div>
        ))}
      </div>
      <div className="overview-grid">
        <section className="panel activity-panel">
          <div className="panel-head">
            <div>
              <h2>Delivery activity</h2>
              <p>Planned routes and current progress</p>
            </div>
            <span className="quiet-label">Illustrative overview</span>
          </div>
          <CityMap compact selectedRoute={1} />
        </section>
        <section className="panel active-routes">
          <div className="panel-head">
            <div>
              <h2>Active routes</h2>
              <p>Progress across today’s fleet</p>
            </div>
            <button className="text-link" onClick={() => goTo("tracking")}>
              View tracking
            </button>
          </div>
          <div className="route-summary-list">
            {routes.map((route) => (
              <div className="route-summary" key={route.id}>
                <div className={`route-dot tone-${route.tone}`} />
                <div className="route-summary-main">
                  <strong>{route.driver}</strong>
                  <span>
                    {route.label} · {route.stops} stops
                  </span>
                  <div className="progress">
                    <i
                      style={{
                        width: `${Math.max(8, (route.completed / route.stops) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="route-progress">
                  <b>
                    {route.completed}/{route.stops}
                  </b>
                  <span>completed</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="overview-lower">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Upcoming deliveries</h2>
              <p>Next scheduled stops across active routes</p>
            </div>
            <button className="text-link" onClick={() => goTo("orders")}>
              All orders
            </button>
          </div>
          <div className="upcoming-list">
            {initialOrders.slice(1, 5).map((order, i) => (
              <div className="upcoming" key={order.id}>
                <span className="time-box">
                  {["09:45", "10:10", "10:30", "10:45"][i]}
                  <small>AM</small>
                </span>
                <div>
                  <strong>{order.customer}</strong>
                  <span>{order.address}</span>
                </div>
                <div className="upcoming-driver">
                  <span>{order.driver}</span>
                  <Status value={order.status} />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="panel exception-panel">
          <div className="panel-head">
            <div>
              <h2>Needs attention</h2>
              <p>Orders excluded from current assignments</p>
            </div>
            <span className="count-label">2 orders</span>
          </div>
          <div className="exception-item">
            <Icon name="clock" />
            <div>
              <strong>RM-1081 · Delivery window conflict</strong>
              <p>
                Available driver schedules do not meet the requested window.
              </p>
            </div>
          </div>
          <div className="exception-item">
            <Icon name="warning" />
            <div>
              <strong>RM-1084 · Vehicle capacity unavailable</strong>
              <p>Order load exceeds currently available vehicle capacity.</p>
            </div>
          </div>
          <Button onClick={() => goTo("orders")} variant="quiet">
            Review unassigned orders <Icon name="chevron" size={15} />
          </Button>
        </section>
      </div>
    </div>
  )
}

const stopRows = [
  ["01", "Depot", "Starting point", "08:30 AM", "—", "Completed"],
  [
    "02",
    "RM-1042",
    "Central Market",
    "09:00–09:30 AM",
    "2 parcels",
    "Delivered",
  ],
  [
    "03",
    "RM-1057",
    "Riverside Road",
    "09:45–10:15 AM",
    "4 parcels",
    "In transit",
  ],
  ["04", "RM-1063", "West End", "10:30–11:00 AM", "1 parcel", "Scheduled"],
  [
    "05",
    "RM-1071",
    "Garden Avenue",
    "11:15–11:45 AM",
    "3 parcels",
    "Scheduled",
  ],
  ["06", "RM-1088", "Holland Park", "12:10–12:40 PM", "2 parcels", "Scheduled"],
]

function PlannerPage({
  date,
  setDate,
}: {
  date: string
  setDate: (date: string) => void
}) {
  const [selected, setSelected] = useState(1)
  const [optimizing, setOptimizing] = useState(false)
  const [result, setResult] = useState(false)
  const [saved, setSaved] = useState(false)
  const optimize = () => {
    setOptimizing(true)
    setResult(false)
    window.setTimeout(() => {
      setOptimizing(false)
      setResult(true)
      setSaved(false)
    }, 900)
  }
  return (
    <div className="page planner-page">
      <PageHeader
        title="Route Planner"
        subtitle="Build feasible delivery routes for your fleet."
        actions={
          <>
            <label className="date-control">
              <Icon name="calendar" size={16} />
              <input
                onChange={(e) => setDate(e.target.value)}
                type="date"
                value={date}
              />
            </label>
            <select className="select">
              <option>Morning shift</option>
              <option>Afternoon shift</option>
            </select>
            <Button onClick={() => setSaved(true)}>
              <Icon name={saved ? "check" : "save"} size={16} />
              {saved ? "Plan saved" : "Save Plan"}
            </Button>
            <Button disabled={optimizing} onClick={optimize} variant="primary">
              <Icon name={optimizing ? "history" : "spark"} size={16} />
              {optimizing ? "Optimizing…" : "Optimize Routes"}
            </Button>
          </>
        }
      />
      <div className="planner-note">
        <span>
          <Icon name="info" size={15} />
          Planner: Greedy + 2-opt{" "}
          <span className="tooltip">
            Constructs a starting route and improves the stop sequence while
            checking constraints.
          </span>
        </span>
        {result && (
          <strong>
            <Icon name="check" size={15} />
            Route plan updated. Capacity and delivery-window checks passed for
            assigned orders.
          </strong>
        )}
      </div>
      <div className="planner-workspace">
        <CityMap onSelectRoute={setSelected} selectedRoute={selected} />
        <section className="panel route-inspector">
          <div className="panel-head">
            <div>
              <h2>Planned routes</h2>
              <p>4 vehicles assigned · 24 stops</p>
            </div>
            <span className="count-label">4 routes</span>
          </div>
          <div className="route-card-list">
            {routes.map((route) => (
              <button
                className={`route-row ${
                  selected === route.id ? "selected" : ""
                }`}
                key={route.id}
                onClick={() => setSelected(route.id)}
              >
                <i className={`route-bar tone-${route.tone}`} />
                <div className="route-row-top">
                  <div className="avatar">
                    {route.driver
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <span>{route.label}</span>
                    <strong>{route.driver}</strong>
                    <small>{route.vehicle}</small>
                  </div>
                  <Icon name="chevron" size={16} />
                </div>
                <div className="route-row-stats">
                  <span>
                    <b>{route.stops}</b> stops
                  </span>
                  <span>{route.duration}</span>
                  <span>{route.distance}</span>
                </div>
                <div className="capacity">
                  <span>Capacity</span>
                  <div>
                    <i style={{ width: `${route.capacity}%` }} />
                  </div>
                  <b>{route.capacity}%</b>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
      <section className="panel stop-panel">
        <div className="panel-head">
          <div>
            <h2>{routes[selected - 1].label} · Stop sequence</h2>
            <p>
              {routes[selected - 1].driver} · Completed stops remain fixed
              during replanning
            </p>
          </div>
          <div className="validation-group">
            <span>
              <Icon name="check" size={14} />
              Capacity valid
            </span>
            <span>
              <Icon name="check" size={14} />
              Windows valid
            </span>
          </div>
        </div>
        <DataTable
          headers={[
            "Stop",
            "Order",
            "Delivery location",
            "Time window",
            "Load",
            "Status",
          ]}
          rows={stopRows.map((row) =>
            row.map((cell, i) => (i === 5 ? <Status value={cell} /> : cell)),
          )}
        />
      </section>
      <section className="panel planner-exceptions">
        <div>
          <Icon name="warning" />
          <span>
            <strong>2 orders remain unassigned</strong>Constraint checks
            prevented infeasible assignments.
          </span>
        </div>
        <button className="text-link">Review exceptions</button>
      </section>
    </div>
  )
}

function DataTable({
  headers,
  rows,
  onRow,
}: {
  headers: string[]
  rows: React.ReactNode[][]
  onRow?: (index: number) => void
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} onClick={() => onRow?.(ri)}>
              {row.map((cell, ci) => (
                <td key={ci}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OrderDrawer({ order, onClose }: { order: Order onClose: () => void }) {
  return (
    <Drawer onClose={onClose} subtitle={order.customer} title={order.id}>
      <div className="drawer-status">
        <Status value={order.status} />
        <span>Delivery on 29 October 2026</span>
      </div>
      <DetailSection title="Customer & delivery">
        <Detail label="Customer" value={order.customer} />
        <Detail label="Address" value={order.address} />
        <Detail label="Time window" value={order.window} />
        <Detail label="Service time" value={order.service} />
      </DetailSection>
      <DetailSection title="Order requirements">
        <Detail
          label="Parcel load"
          value={`${order.load} · ${order.loadValue} kg`}
        />
        <Detail label="Priority" value={order.priority} />
        <Detail label="Assigned driver" value={order.driver} />
        <Detail label="Delivery date" value="Thursday, 29 October 2026" />
      </DetailSection>
      <div className="drawer-callout">
        <Icon name="info" />
        <p>
          This prototype uses illustrative order and assignment data. Changes
          are stored only in this session.
        </p>
      </div>
      <div className="drawer-actions">
        <Button>
          <Icon name="edit" size={16} />
          Edit order
        </Button>
        <Button variant="primary">Assign to route</Button>
      </div>
    </Drawer>
  )
}

function Detail({ label, value }: { label: string value: string }) {
  return (
    <div className="detail">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
function DetailSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="detail-section">
      <h3>{title}</h3>
      {children}
    </section>
  )
}

function NewOrderModal({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (order: Order) => void
}) {
  const [customer, setCustomer] = useState("")
  const [address, setAddress] = useState("")
  const [attempted, setAttempted] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    setAttempted(true)
    if (!customer.trim() || !address.trim()) return
    onSave({
      id: `RM-${1091 + Math.floor(Math.random() * 50)}`,
      customer,
      address,
      window: "01:00–02:00 PM",
      priority: "Standard",
      load: "1 parcel",
      loadValue: 10,
      driver: "Unassigned",
      status: "Unassigned",
      service: "10 min",
      date: "2026-10-29",
    })
  }
  return (
    <Modal
      onClose={onClose}
      subtitle="Add a delivery and its planning requirements."
      title="New order"
    >
      <form className="form" onSubmit={submit}>
        <div className="form-grid">
          <label className={attempted && !customer ? "invalid" : ""}>
            <span>Customer name *</span>
            <input
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="e.g. Northfield Cafe"
              value={customer}
            />
            {attempted && !customer && (
              <small>Customer name is required.</small>
            )}
          </label>
          <label>
            <span>Order ID</span>
            <input disabled value="Generated on save" />
          </label>
          <label className={`span-2 ${attempted && !address ? "invalid" : ""}`}>
            <span>Delivery address *</span>
            <input
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, area, city"
              value={address}
            />
            {attempted && !address && (
              <small>Delivery address is required.</small>
            )}
          </label>
          <label>
            <span>Delivery date</span>
            <input type="date" value="2026-10-29" readOnly />
          </label>
          <label>
            <span>Priority</span>
            <select>
              <option>Standard</option>
              <option>High</option>
              <option>Low</option>
            </select>
          </label>
          <label>
            <span>Window starts</span>
            <input type="time" defaultValue="13:00" />
          </label>
          <label>
            <span>Window ends</span>
            <input type="time" defaultValue="14:00" />
          </label>
          <label>
            <span>Parcel load</span>
            <input min="1" type="number" defaultValue="1" />
          </label>
          <label>
            <span>Service time</span>
            <select>
              <option>10 minutes</option>
              <option>15 minutes</option>
              <option>20 minutes</option>
            </select>
          </label>
        </div>
        <div className="modal-actions">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">
            Create order
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function OrdersPage({
  orders,
  setOrders,
  globalSearch,
}: {
  orders: Order[]
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>
  globalSearch: string
}) {
  const [search, setSearch] = useState(globalSearch)
  const [status, setStatus] = useState("All statuses")
  const [priority, setPriority] = useState("All priorities")
  const [selected, setSelected] = useState<Order | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const filtered = orders.filter(
    (o) =>
      `${o.id} ${o.customer} ${o.address}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (status === "All statuses" || o.status === status) &&
      (priority === "All priorities" || o.priority === priority),
  )
  const save = (order: Order) => {
    setOrders((current) => [order, ...current])
    setNewOpen(false)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }
  return (
    <div className="page">
      <PageHeader
        title="Orders"
        subtitle="Manage incoming deliveries and their requirements."
        actions={
          <Button onClick={() => setNewOpen(true)} variant="primary">
            <Icon name="plus" size={16} />
            New Order
          </Button>
        }
      />
      {saved && (
        <div className="success-banner">
          <Icon name="check" />
          Order created and added to the unassigned queue.
        </div>
      )}
      <div className="order-counts">
        {[
          ["All orders", orders.length],
          ["Scheduled", orders.filter((o) => o.status === "Scheduled").length],
          [
            "In progress",
            orders.filter((o) => o.status === "In transit").length,
          ],
          [
            "Needs attention",
            orders.filter((o) => ["Exception", "Unassigned"].includes(o.status))
              .length,
          ],
        ].map(([label, count], i) => (
          <div className={i === 3 ? "attention" : ""} key={label}>
            <span>{label}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>
      <section className="panel table-panel">
        <div className="filter-bar">
          <label className="search-input">
            <Icon name="search" size={17} />
            <input
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders, customers, or addresses…"
              value={search}
            />
          </label>
          <select onChange={(e) => setStatus(e.target.value)} value={status}>
            <option>All statuses</option>
            <option>Delivered</option>
            <option>In transit</option>
            <option>Scheduled</option>
            <option>Unassigned</option>
            <option>Exception</option>
          </select>
          <select
            onChange={(e) => setPriority(e.target.value)}
            value={priority}
          >
            <option>All priorities</option>
            <option>High</option>
            <option>Standard</option>
            <option>Low</option>
          </select>
          <input
            aria-label="Delivery date"
            type="date"
            defaultValue="2026-10-29"
          />
          <span className="result-count">{filtered.length} orders</span>
        </div>
        <DataTable
          headers={[
            "Order ID",
            "Customer",
            "Delivery address",
            "Delivery window",
            "Priority",
            "Load",
            "Assigned driver",
            "Status",
            "",
          ]}
          onRow={(i) => setSelected(filtered[i])}
          rows={filtered.map((o) => [
            <strong>{o.id}</strong>,
            o.customer,
            o.address,
            o.window,
            <span className={`priority priority-${o.priority.toLowerCase()}`}>
              {o.priority}
            </span>,
            o.load,
            o.driver,
            <Status value={o.status} />,
            <Icon name="chevron" size={15} />,
          ])}
        />
      </section>
      {selected && (
        <OrderDrawer onClose={() => setSelected(null)} order={selected} />
      )}
      {newOpen && (
        <NewOrderModal onClose={() => setNewOpen(false)} onSave={save} />
      )}
    </div>
  )
}

function AddFleetModal({
  type,
  onClose,
  onDriver,
  onVehicle,
}: {
  type: "Drivers" | "Vehicles"
  onClose: () => void
  onDriver: (d: Driver) => void
  onVehicle: (v: Vehicle) => void
}) {
  const [name, setName] = useState("")
  const [attempted, setAttempted] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    setAttempted(true)
    if (!name) return
    if (type === "Drivers")
      onDriver({
        id: `DRV-0${initialDrivers.length + 1}`,
        name,
        initials: name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2),
        status: "Available",
        route: "Not assigned",
        assigned: 0,
        completed: 0,
        shift: "09:00 AM–05:00 PM",
        phone: "+91 98765 00000",
        email: `${name.toLowerCase().replace(" ", ".")}@routemind.demo`,
        eta: "—",
      })
    else
      onVehicle({
        id: name.toUpperCase(),
        type: "Delivery van",
        capacity: 180,
        load: 0,
        status: "Available",
        driver: "Unassigned",
        operational: "Ready",
      })
  }
  return (
    <Modal
      onClose={onClose}
      subtitle={
        type === "Drivers"
          ? "Create an available driver profile."
          : "Add a vehicle to the operating fleet."
      }
      title={type === "Drivers" ? "Add driver" : "Add vehicle"}
    >
      <form className="form" onSubmit={submit}>
        <div className="form-grid">
          {type === "Drivers" ? (
            <>
              <label
                className={`span-2 ${attempted && !name ? "invalid" : ""}`}
              >
                <span>Full name *</span>
                <input
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Driver name"
                />
                {attempted && !name && <small>Driver name is required.</small>}
              </label>
              <label>
                <span>Phone</span>
                <input placeholder="+91 98765 00000" />
              </label>
              <label>
                <span>Shift</span>
                <select>
                  <option>09:00 AM–05:00 PM</option>
                  <option>08:00 AM–04:00 PM</option>
                </select>
              </label>
            </>
          ) : (
            <>
              <label
                className={`span-2 ${attempted && !name ? "invalid" : ""}`}
              >
                <span>Registration identifier *</span>
                <input
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. HR-26-AB-1234"
                />
                {attempted && !name && (
                  <small>Vehicle identifier is required.</small>
                )}
              </label>
              <label>
                <span>Vehicle type</span>
                <select>
                  <option>Delivery van</option>
                  <option>Mini truck</option>
                  <option>Mini van</option>
                </select>
              </label>
              <label>
                <span>Maximum capacity</span>
                <input defaultValue="180" type="number" />
              </label>
            </>
          )}
        </div>
        <div className="modal-actions">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">
            Save {type === "Drivers" ? "driver" : "vehicle"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function FleetPage({
  drivers,
  setDrivers,
  vehicles,
  setVehicles,
}: {
  drivers: Driver[]
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>
  vehicles: Vehicle[]
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>
}) {
  const [tab, setTab] = useState<"Drivers" | "Vehicles">("Drivers")
  const [selected, setSelected] = useState<Driver | Vehicle | null>(null)
  const [adding, setAdding] = useState(false)
  return (
    <div className="page">
      <PageHeader
        title="Drivers & Vehicles"
        subtitle="Manage fleet availability, capacity, and route assignments."
        actions={
          <Button onClick={() => setAdding(true)} variant="primary">
            <Icon name="plus" size={16} />
            Add {tab === "Drivers" ? "Driver" : "Vehicle"}
          </Button>
        }
      />
      <div className="tabs">
        <button
          className={tab === "Drivers" ? "active" : ""}
          onClick={() => setTab("Drivers")}
        >
          Drivers <span>{drivers.length}</span>
        </button>
        <button
          className={tab === "Vehicles" ? "active" : ""}
          onClick={() => setTab("Vehicles")}
        >
          Vehicles <span>{vehicles.length}</span>
        </button>
      </div>
      <div className="fleet-summary">
        {tab === "Drivers" ? (
          <>
            <div>
              <span>On route</span>
              <strong>3</strong>
            </div>
            <div>
              <span>Available</span>
              <strong>
                {drivers.filter((d) => d.status === "Available").length}
              </strong>
            </div>
            <div>
              <span>Deliveries assigned</span>
              <strong>24</strong>
            </div>
            <div>
              <span>Completed today</span>
              <strong>6</strong>
            </div>
          </>
        ) : (
          <>
            <div>
              <span>In service</span>
              <strong>
                {vehicles.filter((v) => v.status === "In service").length}
              </strong>
            </div>
            <div>
              <span>Available</span>
              <strong>
                {vehicles.filter((v) => v.status === "Available").length}
              </strong>
            </div>
            <div>
              <span>Maintenance</span>
              <strong>
                {vehicles.filter((v) => v.status === "Maintenance").length}
              </strong>
            </div>
            <div>
              <span>Total capacity</span>
              <strong>{vehicles.reduce((a, v) => a + v.capacity, 0)} kg</strong>
            </div>
          </>
        )}
      </div>
      <section className="panel table-panel">
        {tab === "Drivers" ? (
          <DataTable
            headers={[
              "Driver",
              "Availability",
              "Assigned route",
              "Delivery progress",
              "Shift hours",
              "Contact",
              "",
            ]}
            onRow={(i) => setSelected(drivers[i])}
            rows={drivers.map((d) => [
              <div className="person-cell">
                <span className="avatar">{d.initials}</span>
                <strong>{d.name}</strong>
              </div>,
              <Status value={d.status} />,
              d.route,
              <div className="inline-progress">
                <span>
                  {d.completed}/{d.assigned || 0}
                </span>
                <div>
                  <i
                    style={{
                      width: `${
                        d.assigned ? (d.completed / d.assigned) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>,
              d.shift,
              <div className="contact-cell">
                <span>{d.phone}</span>
                <small>{d.email}</small>
              </div>,
              <Icon name="chevron" size={15} />,
            ])}
          />
        ) : (
          <DataTable
            headers={[
              "Vehicle",
              "Type",
              "Maximum capacity",
              "Assigned load",
              "Availability",
              "Assigned driver",
              "Operational status",
              "",
            ]}
            onRow={(i) => setSelected(vehicles[i])}
            rows={vehicles.map((v) => [
              <strong>{v.id}</strong>,
              v.type,
              `${v.capacity} kg`,
              <div className="vehicle-load">
                <span>{v.load} kg</span>
                <div>
                  <i style={{ width: `${(v.load / v.capacity) * 100}%` }} />
                </div>
              </div>,
              <Status value={v.status} />,
              v.driver,
              v.operational,
              <Icon name="chevron" size={15} />,
            ])}
          />
        )}
      </section>
      {selected && (
        <Drawer
          onClose={() => setSelected(null)}
          subtitle={"name" in selected ? selected.id : selected.type}
          title={"name" in selected ? selected.name : selected.id}
        >
          <div className="profile-hero">
            <div className="avatar large">
              {"name" in selected ? selected.initials : <Icon name="truck" />}
            </div>
            <div>
              <Status value={selected.status} />
              <p>
                {"name" in selected ? selected.route : selected.operational}
              </p>
            </div>
          </div>
          {"name" in selected ? (
            <>
              <DetailSection title="Driver assignment">
                <Detail label="Assigned route" value={selected.route} />
                <Detail
                  label="Delivery progress"
                  value={`${selected.completed} of ${selected.assigned} completed`}
                />
                <Detail label="Shift" value={selected.shift} />
              </DetailSection>
              <DetailSection title="Contact">
                <Detail label="Phone" value={selected.phone} />
                <Detail label="Email" value={selected.email} />
              </DetailSection>
            </>
          ) : (
            <>
              <DetailSection title="Vehicle capacity">
                <Detail label="Type" value={selected.type} />
                <Detail
                  label="Maximum load"
                  value={`${selected.capacity} kg`}
                />
                <Detail label="Assigned load" value={`${selected.load} kg`} />
              </DetailSection>
              <DetailSection title="Assignment">
                <Detail label="Driver" value={selected.driver} />
                <Detail
                  label="Operational status"
                  value={selected.operational}
                />
              </DetailSection>
            </>
          )}
        </Drawer>
      )}
      {adding && (
        <AddFleetModal
          onClose={() => setAdding(false)}
          onDriver={(d) => {
            setDrivers((x) => [...x, d])
            setAdding(false)
          }}
          onVehicle={(v) => {
            setVehicles((x) => [...x, v])
            setAdding(false)
          }}
          type={tab}
        />
      )}
    </div>
  )
}

function TrackingPage({ drivers }: { drivers: Driver[] }) {
  const active = drivers.filter((d) => d.route !== "Not assigned")
  const [selected, setSelected] = useState(active[0])
  const [filter, setFilter] = useState("All active")
  const visible = active.filter(
    (d) =>
      filter === "All active" ||
      (filter === "Delayed" ? d.name === "Riya Kapoor" : d.status === filter),
  )
  return (
    <div className="page tracking-page">
      <PageHeader
        title="Live Tracking"
        subtitle="Monitor delivery execution using simulated prototype positions."
        actions={
          <>
            <select
              className="select"
              onChange={(e) => setFilter(e.target.value)}
              value={filter}
            >
              <option>All active</option>
              <option>On route</option>
              <option>Delayed</option>
              <option>Available</option>
            </select>
            <span className="simulation-label">
              <i />
              Simulated data
            </span>
          </>
        }
      />
      <div className="tracking-workspace">
        <section className="panel driver-panel">
          <div className="panel-head">
            <div>
              <h2>Active drivers</h2>
              <p>{visible.length} shown · prototype status</p>
            </div>
          </div>
          <div className="driver-list">
            {visible.map((d, i) => {
              const route = routes.find((r) => r.driver === d.name)!
              return (
                <button
                  className={selected.id === d.id ? "selected" : ""}
                  key={d.id}
                  onClick={() => setSelected(d)}
                >
                  <div className="driver-list-top">
                    <span className="avatar">{d.initials}</span>
                    <div>
                      <strong>{d.name}</strong>
                      <span>
                        {d.route} · {route?.current}
                      </span>
                    </div>
                    <Status
                      value={d.name === "Riya Kapoor" ? "Delayed" : d.status}
                    />
                  </div>
                  <div className="driver-progress">
                    <div>
                      <i
                        style={{
                          width: `${(route.completed / route.stops) * 100}%`,
                        }}
                      />
                    </div>
                    <span>
                      {route.completed} of {route.stops} stops
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </section>
        <CityMap
          onSelectRoute={(id) => setSelected(active[id - 1])}
          selectedRoute={Number(selected.route.split(" ")[1]) || 1}
          tracking
        />
        <section className="panel selected-driver">
          <div className="selected-driver-head">
            <span className="avatar large">{selected.initials}</span>
            <div>
              <h2>{selected.name}</h2>
              <p>
                {selected.route} · Next ETA {selected.eta}
              </p>
            </div>
          </div>
          <div className="tracking-stats">
            <div>
              <span>Progress</span>
              <strong>
                {routes.find((r) => r.driver === selected.name)?.completed || 0}
                /{routes.find((r) => r.driver === selected.name)?.stops || 0}
              </strong>
            </div>
            <div>
              <span>Remaining</span>
              <strong>
                {routes.find((r) => r.driver === selected.name)?.distance}
              </strong>
            </div>
          </div>
          <h3>Remaining stops</h3>
          <div className="mini-sequence">
            {stopRows.slice(2, 6).map((s, i) => (
              <div key={s[1]}>
                <span>{i + 1}</span>
                <div>
                  <strong>{s[2]}</strong>
                  <small>{s[3]}</small>
                </div>
                <Status value={i === 0 ? "In transit" : "Upcoming"} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function AnalyticsPage() {
  const [range, setRange] = useState("Last 7 days")
  const multiplier = range === "Last 30 days" ? 4 : 1
  return (
    <div className="page">
      <PageHeader
        title="Analytics"
        subtitle="Review delivery and route performance using illustrative data."
        actions={
          <>
            <select
              className="select"
              onChange={(e) => setRange(e.target.value)}
              value={range}
            >
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>This quarter</option>
            </select>
            <Button>
              <Icon name="download" size={16} />
              Export Report
            </Button>
          </>
        }
      />
      <div className="mock-data-note">
        <Icon name="info" size={16} />
        All analytics shown are illustrative prototype data and do not represent
        measured optimization benefits.
      </div>
      <div className="analytic-metrics">
        <div>
          <span>Delivery completion rate</span>
          <strong>92.4%</strong>
          <small>
            {158 * multiplier} of {172 * multiplier} orders
          </small>
        </div>
        <div>
          <span>Planned distance</span>
          <strong>{428 * multiplier} km</strong>
          <small>Across {27 * multiplier} routes</small>
        </div>
        <div>
          <span>Actual distance</span>
          <strong>{441 * multiplier} km</strong>
          <small>Recorded mock totals</small>
        </div>
        <div>
          <span>Route utilization</span>
          <strong>74%</strong>
          <small>Average vehicle capacity</small>
        </div>
      </div>
      <div className="chart-grid">
        <section className="panel chart-card wide">
          <div className="panel-head">
            <div>
              <h2>Orders completed per day</h2>
              <p>Completed and delayed deliveries</p>
            </div>
            <span className="chart-unit">Orders</span>
          </div>
          <BarChart />
        </section>
        <section className="panel chart-card">
          <div className="panel-head">
            <div>
              <h2>On-time performance</h2>
              <p>Delivery outcome mix</p>
            </div>
          </div>
          <DonutChart />
          <div className="legend-list">
            <span>
              <i className="legend-sage" />
              On time <b>86%</b>
            </span>
            <span>
              <i className="legend-gold" />
              Delayed <b>9%</b>
            </span>
            <span>
              <i className="legend-neutral" />
              Exception <b>5%</b>
            </span>
          </div>
        </section>
        <section className="panel chart-card">
          <div className="panel-head">
            <div>
              <h2>Route utilization</h2>
              <p>Average assigned capacity by route</p>
            </div>
          </div>
          <UtilizationChart />
        </section>
      </div>
      <section className="panel table-panel">
        <div className="panel-head">
          <div>
            <h2>Route performance</h2>
            <p>Illustrative route and delivery results</p>
          </div>
        </div>
        <DataTable
          headers={[
            "Route",
            "Driver",
            "Orders",
            "Completion",
            "Planned distance",
            "Actual distance",
            "On-time",
            "Status",
          ]}
          rows={routes.map((r, i) => [
            r.label,
            r.driver,
            r.stops,
            `${r.completed}/${r.stops}`,
            r.distance,
            `${parseFloat(r.distance) + [0.8, 1.1, 0.4, 1.5][i]} km`,
            `${[94, 88, 91, 84][i]}%`,
            <Status value={i === 3 ? "Review needed" : "On track"} />,
          ])}
        />
      </section>
    </div>
  )
}

function BarChart() {
  const values = [18, 22, 19, 26, 24, 29, 20]
  return (
    <div className="bar-chart">
      <div className="chart-y">
        <span>30</span>
        <span>20</span>
        <span>10</span>
        <span>0</span>
      </div>
      <div className="bars">
        {values.map((v, i) => (
          <div key={i}>
            <div className="bar-stack">
              <i style={{ height: `${(v / 30) * 100}%` }} />
              <b
                style={{ height: `${([2, 1, 3, 2, 1, 3, 2][i] / 30) * 100}%` }}
              />
            </div>
            <span>{["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"][i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
function DonutChart() {
  return (
    <div className="donut-wrap">
      <div className="donut">
        <div>
          <strong>92.4%</strong>
          <span>completed</span>
        </div>
      </div>
    </div>
  )
}
function UtilizationChart() {
  return (
    <div className="utilization-chart">
      {routes.map((r) => (
        <div key={r.id}>
          <span>{r.label}</span>
          <div>
            <i
              className={`tone-${r.tone}`}
              style={{ width: `${r.capacity}%` }}
            />
          </div>
          <b>{r.capacity}%</b>
        </div>
      ))}
    </div>
  )
}

function HistoryPage() {
  const [selected, setSelected] = useState<typeof historyRuns[number] | null>(
    null,
  )
  return (
    <div className="page">
      <PageHeader
        title="Optimization History"
        subtitle="Inspect previous route-planning runs and feasibility outcomes."
        actions={
          <label className="search-input compact">
            <Icon name="search" size={16} />
            <input placeholder="Search run ID…" />
          </label>
        }
      />
      <section className="panel table-panel">
        <div className="panel-head">
          <div>
            <h2>Planning runs</h2>
            <p>Route plans generated with the prototype planner</p>
          </div>
          <select>
            <option>All statuses</option>
            <option>Feasible</option>
            <option>Review needed</option>
          </select>
        </div>
        <DataTable
          headers={[
            "Run ID",
            "Run date & time",
            "Orders",
            "Vehicles",
            "Planner method",
            "Feasibility",
            "Est. distance",
            "Est. duration",
            "Unassigned",
            "",
          ]}
          onRow={(i) => setSelected(historyRuns[i])}
          rows={historyRuns.map((r) => [
            <strong>{r.id}</strong>,
            r.date,
            r.orders,
            r.vehicles,
            r.method,
            <Status value={r.status} />,
            r.distance,
            r.duration,
            r.unassigned,
            <Icon name="chevron" size={15} />,
          ])}
        />
      </section>
      {selected && (
        <Drawer
          onClose={() => setSelected(null)}
          subtitle={selected.date}
          title={selected.id}
        >
          <div className="drawer-status">
            <Status value={selected.status} />
            <span>{selected.method}</span>
          </div>
          <DetailSection title="Run summary">
            <Detail label="Orders processed" value={`${selected.orders}`} />
            <Detail label="Vehicles used" value={`${selected.vehicles}`} />
            <Detail label="Estimated distance" value={selected.distance} />
            <Detail label="Estimated duration" value={selected.duration} />
          </DetailSection>
          <DetailSection title="Assignment result">
            <Detail
              label="Assigned orders"
              value={`${selected.orders - selected.unassigned}`}
            />
            <Detail
              label="Unassigned orders"
              value={`${selected.unassigned}`}
            />
            <Detail
              label="Constraint checks"
              value={
                selected.status === "Feasible"
                  ? "Passed for assigned orders"
                  : "Review required"
              }
            />
          </DetailSection>
          {selected.unassigned > 0 && (
            <div className="drawer-callout warning">
              <Icon name="warning" />
              <p>
                {selected.unassigned} order
                {selected.unassigned > 1 ? "s were" : " was"} excluded because
                available assignments did not satisfy capacity or time-window
                constraints.
              </p>
            </div>
          )}
          <div className="plan-snapshot">
            <h3>Plan snapshot</h3>
            {routes.slice(0, selected.vehicles).map((r) => (
              <div key={r.id}>
                <i className={`tone-${r.tone}`} />
                <span>
                  {r.label} · {r.driver}
                </span>
                <strong>{r.distance}</strong>
              </div>
            ))}
          </div>
        </Drawer>
      )}
    </div>
  )
}

type Settings = {
  business: string
  address: string
  method: string
  service: string
  capacityBuffer: string
  windows: boolean
  email: boolean
  exceptions: boolean
  compact: boolean
}
function SettingsPage({
  settings,
  setSettings,
}: {
  settings: Settings
  setSettings: React.Dispatch<React.SetStateAction<Settings>>
}) {
  const [saved, setSaved] = useState(false)
  const update = (key: keyof Settings, value: string | boolean) =>
    setSettings((s) => ({ ...s, [key]: value }))
  return (
    <div className="page settings-page">
      <PageHeader
        title="Settings"
        subtitle="Configure operational preferences for RouteMind."
      />
      {saved && (
        <div className="success-banner">
          <Icon name="check" />
          Settings saved for this prototype session.
        </div>
      )}
      <div className="settings-layout">
        <nav className="settings-nav">
          <button className="active">Business profile</button>
          <button>Planning defaults</button>
          <button>Capacity preferences</button>
          <button>Notifications</button>
          <button>Account</button>
        </nav>
        <div className="settings-content">
          <section className="panel setting-section">
            <div>
              <h2>Business profile</h2>
              <p>Information used across delivery planning documents.</p>
            </div>
            <div className="setting-fields">
              <label>
                <span>Business name</span>
                <input
                  onChange={(e) => update("business", e.target.value)}
                  value={settings.business}
                />
              </label>
              <label>
                <span>Operations manager</span>
                <input disabled value="Alex Morgan" />
              </label>
              <label className="span-2">
                <span>Dispatch address</span>
                <input
                  onChange={(e) => update("address", e.target.value)}
                  value={settings.address}
                />
              </label>
            </div>
          </section>
          <section className="panel setting-section">
            <div>
              <h2>Delivery planning defaults</h2>
              <p>Defaults used when constructing a new daily plan.</p>
            </div>
            <div className="setting-fields">
              <label>
                <span>Planner method</span>
                <select
                  onChange={(e) => update("method", e.target.value)}
                  value={settings.method}
                >
                  <option>Greedy + 2-opt</option>
                  <option>Greedy only</option>
                </select>
              </label>
              <label>
                <span>Standard service time</span>
                <select
                  onChange={(e) => update("service", e.target.value)}
                  value={settings.service}
                >
                  <option>10 minutes</option>
                  <option>15 minutes</option>
                  <option>20 minutes</option>
                </select>
              </label>
              <label>
                <span>Vehicle capacity buffer</span>
                <select
                  onChange={(e) => update("capacityBuffer", e.target.value)}
                  value={settings.capacityBuffer}
                >
                  <option>10%</option>
                  <option>5%</option>
                  <option>No buffer</option>
                </select>
              </label>
              <Toggle
                checked={settings.windows}
                label="Enforce delivery time windows"
                note="Keep orders unassigned when no feasible window exists."
                onChange={(v) => update("windows", v)}
              />
            </div>
          </section>
          <section className="panel setting-section">
            <div>
              <h2>Notification preferences</h2>
              <p>Choose which operational events should be surfaced.</p>
            </div>
            <div className="toggle-list">
              <Toggle
                checked={settings.email}
                label="Daily plan summary"
                note="Receive a summary after a plan is saved."
                onChange={(v) => update("email", v)}
              />
              <Toggle
                checked={settings.exceptions}
                label="Constraint exceptions"
                note="Notify when orders cannot be assigned feasibly."
                onChange={(v) => update("exceptions", v)}
              />
              <Toggle
                checked={settings.compact}
                label="Compact table density"
                note="Use denser rows in order and fleet tables."
                onChange={(v) => update("compact", v)}
              />
            </div>
          </section>
          <div className="settings-save">
            <Button
              onClick={() => {
                setSaved(true)
                window.setTimeout(() => setSaved(false), 2200)
              }}
              variant="primary"
            >
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  label,
  note,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  note: string
}) {
  return (
    <label className="toggle-row">
      <span>
        <strong>{label}</strong>
        <small>{note}</small>
      </span>
      <input
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        type="checkbox"
      />
      <i />
    </label>
  )
}

function pageFromHash(): Page {
  const hash = window.location.hash.replace("#/", "") as Page
  return pageTitles[hash] ? hash : "overview"
}

export default function App() {
  const [page, setPage] = useState<Page>(pageFromHash)
  const [date, setDate] = useState("2026-10-29")
  const [globalSearch, setGlobalSearch] = useState("")
  const [orders, setOrders] = useState(initialOrders)
  const [drivers, setDrivers] = useState(initialDrivers)
  const [vehicles, setVehicles] = useState(initialVehicles)
  const [settings, setSettings] = useState<Settings>({
    business: "RouteMind Demo Logistics",
    address: "12 Commerce Avenue, Chandigarh",
    method: "Greedy + 2-opt",
    service: "10 minutes",
    capacityBuffer: "10%",
    windows: true,
    email: true,
    exceptions: true,
    compact: false,
  })
  useEffect(() => {
    const handler = () => setPage(pageFromHash())
    window.addEventListener("hashchange", handler)
    return () => window.removeEventListener("hashchange", handler)
  }, [])
  const goTo = (next: Page) => {
    window.location.hash = `/${next}`
    setPage(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  const searchSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (globalSearch.trim()) goTo("orders")
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        {navGroups.map((group) => (
          <div className="nav-group" key={group.label}>
            <span className="nav-label">{group.label}</span>
            {group.items.map((item) => (
              <button
                className={`nav-item ${page === item.page ? "active" : ""}`}
                key={item.page}
                onClick={() => goTo(item.page)}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
                {item.page === "orders" && <b>{orders.length}</b>}
              </button>
            ))}
          </div>
        ))}
        <div className="sidebar-spacer" />
        <div className="account">
          <span className="avatar">AM</span>
          <div>
            <strong>Alex Morgan</strong>
            <small>Operations Manager</small>
          </div>
          <Icon name="menu" size={16} />
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="crumb">
            <span>RouteMind</span>
            <Icon name="chevron" size={13} />
            <strong>{pageTitles[page]}</strong>
          </div>
          <div className="top-actions">
            <form className="global-search" onSubmit={searchSubmit}>
              <Icon name="search" size={17} />
              <input
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search orders…"
                value={globalSearch}
              />
            </form>
            <button aria-label="Notifications" className="top-icon">
              <Icon name="bell" />
              <i />
            </button>
            <div className="top-account">
              <span className="avatar">AM</span>
              <div>
                <strong>Alex Morgan</strong>
                <small>Operations</small>
              </div>
              <Icon name="chevron" size={14} />
            </div>
          </div>
        </header>
        <div className="main-content">
          {page === "overview" && (
            <OverviewPage date={date} goTo={goTo} setDate={setDate} />
          )}
          {page === "planner" && <PlannerPage date={date} setDate={setDate} />}
          {page === "orders" && (
            <OrdersPage
              globalSearch={globalSearch}
              orders={orders}
              setOrders={setOrders}
            />
          )}
          {page === "fleet" && (
            <FleetPage
              drivers={drivers}
              setDrivers={setDrivers}
              setVehicles={setVehicles}
              vehicles={vehicles}
            />
          )}
          {page === "tracking" && <TrackingPage drivers={drivers} />}
          {page === "analytics" && <AnalyticsPage />}
          {page === "history" && <HistoryPage />}
          {page === "settings" && (
            <SettingsPage setSettings={setSettings} settings={settings} />
          )}
        </div>
      </main>
    </div>
  )
}
