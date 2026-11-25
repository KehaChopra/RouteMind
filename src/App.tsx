import { FormEvent, useEffect, useMemo, useState } from "react"
import {
  createDriver,
  createOrder,
  createVehicle,
  generatePlan,
  getLatestPlan,
  listFleet,
  listOrders,
  recordDeliveryEvent,
  type DeliveryUpdate,
  type DriverDraft,
  type OrderDraft,
  type RoutePlan,
  type VehicleDraft,
} from "./api"
import {
  Driver,
  historyRuns,
  initialOrders,
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

function Icon({ name, size = 18 }: { name: IconName, size?: number }) {
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
  items: { page: Page, label: string, icon: IconName }[]
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
      className={`status status-${value.toLowerCase().replace(/ /g, "-")}`}
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

function PlannerPage({ date, setDate }: {
  date: string
  setDate: (date: string) => void
}) {
  const [plan, setPlan] = useState<RoutePlan | null>(null)
  const [selected, setSelected] = useState("")
  const [loading, setLoading] = useState(Boolean(date))
  const [optimizing, setOptimizing] = useState(false)
  const [error, setError] = useState("")
  const route = plan?.routes.find((item) => item.vehicleId === selected) ?? plan?.routes[0]

  useEffect(() => {
    if (!date) return
    const controller = new AbortController()
    getLatestPlan(date, controller.signal)
      .then((saved) => { if (!controller.signal.aborted) setPlan(saved) })
      .catch(() => {
        if (!controller.signal.aborted) setError("Could not load the saved plan. Check that the RouteMind API is running.")
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [date])

  const changeDate = (nextDate: string) => {
    if (nextDate === date) return
    setPlan(null)
    setSelected("")
    setError("")
    setLoading(Boolean(nextDate))
    setDate(nextDate)
  }

  const optimize = async () => {
    if (!date || optimizing || loading) return
    setOptimizing(true)
    setError("")
    try {
      setPlan(await generatePlan(date))
      setSelected("")
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not generate a route plan.")
    } finally {
      setOptimizing(false)
    }
  }

  return (
    <div className="page planner-page">
      <PageHeader
        title="Route Planner"
        subtitle="Build delivery routes from saved orders and available driver–vehicle pairs."
        actions={
          <>
            <label className="date-control">
              <Icon name="calendar" size={16} />
              <input
                aria-label="Planning date"
                disabled={optimizing}
                onChange={(event) => changeDate(event.target.value)}
                type="date"
                value={date}
              />
            </label>
            <Button disabled={!date || loading || optimizing || Boolean(plan?.event)} onClick={optimize} variant="primary">
              <Icon name="spark" size={16} />
              {optimizing ? "Optimizing…" : "Optimize Routes"}
            </Button>
          </>
        }
      />
      <div className="planner-note">
        <span><Icon name="info" size={15} /> Demo travel estimates for sample addresses</span>
        {plan && <strong>Saved plan #{plan.id} · {plan.method}</strong>}
      </div>
      {plan?.event && <p>This plan is in progress. Use Live Tracking to update the remaining stops.</p>}
      {error && <p role="alert">{error}</p>}
      {loading && <p role="status">Loading saved plan…</p>}
      {optimizing && <p role="status">Checking capacity, delivery windows, and driver shifts…</p>}
      {!plan && !loading && !optimizing && !error && (
        <p>{date ? "Select Optimize Routes to create the first plan for this date." : "Choose a planning date."}</p>
      )}
      {plan && (
        <>
          <div className="planner-results">
            <section className="panel route-inspector">
              <div className="panel-head">
                <div>
                  <h2>Planned routes</h2>
                  <p>{plan.orderCount - plan.unassigned.length} of {plan.orderCount} orders assigned</p>
                </div>
              </div>
              <div className="route-card-list">
                {plan.routes.length === 0 && <p>No routes generated for this date.</p>}
                {plan.routes.map((item) => (
                  <button
                    aria-pressed={route?.vehicleId === item.vehicleId}
                    className={`route-row ${route?.vehicleId === item.vehicleId ? "selected" : ""}`}
                    key={item.vehicleId}
                    onClick={() => setSelected(item.vehicleId)}
                  >
                    <div className="route-row-top">
                      <div>
                        <strong>{item.driverName}</strong>
                        <small>{item.vehicleId}</small>
                      </div>
                      <Icon name="chevron" size={16} />
                    </div>
                    <div className="route-row-stats">
                      <span>{item.stops.length} stops</span>
                      <span>{item.distanceKm} km</span>
                      <span>{item.loadKg} / {item.capacityKg} kg</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
            {route && (
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2>Stop sequence</h2>
                    <p>{route.driverName} · {route.returnAt ? `Estimated depot return ${route.returnAt}` : "Depot return falls outside the shift"}</p>
                  </div>
                </div>
                <DataTable
                  headers={["Stop", "Order", "Delivery address", "ETA", "Delivery window", "Delivered at", "Load"]}
                  rows={route.stops.map((stop, index) => [
                    index + 1, stop.orderId, stop.address, stop.eta, stop.window, stop.completedAt ?? "—", `${stop.loadKg} kg`,
                  ])}
                />
              </section>
            )}
          </div>
          {plan.unassigned.length > 0 && (
            <section className="panel">
              <div className="panel-head">
                <div><h2>Unassigned orders ({plan.unassigned.length})</h2></div>
              </div>
              <DataTable
                headers={["Order", "Delivery address", "Reason"]}
                rows={plan.unassigned.map((order) => [order.orderId, order.address, order.reason])}
              />
            </section>
          )}
        </>
      )}
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

function OrderDrawer({ order, onClose }: { order: Order, onClose: () => void }) {
  return (
    <Drawer onClose={onClose} subtitle={order.customer} title={order.id}>
      <div className="drawer-status">
        <Status value={order.status} />
        <span>Delivery on {order.date}</span>
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
        <Detail label="Delivery date" value={order.date} />
      </DetailSection>
    </Drawer>
  )
}

function Detail({ label, value }: { label: string, value: string }) {
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
  date,
  onClose,
  onSave,
}: {
  date: string
  onClose: () => void
  onSave: (draft: OrderDraft) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (saving) return
    const fields = new FormData(e.currentTarget)
    setSaving(true)
    setError("")
    try {
      await onSave({
        customer: String(fields.get("customer")),
        address: String(fields.get("address")),
        date: String(fields.get("date")),
        priority: fields.get("priority") as OrderDraft["priority"],
        windowStart: String(fields.get("windowStart")),
        windowEnd: String(fields.get("windowEnd")),
        parcelCount: Number(fields.get("parcelCount")),
        loadValue: Number(fields.get("loadValue")),
        serviceMinutes: Number(fields.get("serviceMinutes")),
      })
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not save the order.")
      setSaving(false)
    }
  }
  return (
    <Modal
      onClose={() => { if (!saving) onClose() }}
      subtitle="Add a delivery and its planning requirements."
      title="New order"
    >
      <form className="form" onSubmit={submit}>
        <div className="form-grid">
          <label>
            <span>Customer name *</span>
            <input
              maxLength={120}
              name="customer"
              placeholder="e.g. Northfield Cafe"
              required
            />
          </label>
          <label>
            <span>Order ID</span>
            <input disabled value="Generated on save" />
          </label>
          <label className="span-2">
            <span>Delivery address *</span>
            <input
              maxLength={300}
              name="address"
              placeholder="Street, area, city"
              required
            />
          </label>
          <label>
            <span>Delivery date</span>
            <input defaultValue={date} name="date" required type="date" />
          </label>
          <label>
            <span>Priority</span>
            <select name="priority">
              <option>Standard</option>
              <option>High</option>
              <option>Low</option>
            </select>
          </label>
          <label>
            <span>Window starts</span>
            <input defaultValue="13:00" name="windowStart" required type="time" />
          </label>
          <label>
            <span>Window ends</span>
            <input defaultValue="14:00" name="windowEnd" required type="time" />
          </label>
          <label>
            <span>Parcel count</span>
            <input defaultValue="1" min="1" name="parcelCount" required type="number" />
          </label>
          <label>
            <span>Total weight (kg)</span>
            <input min="0.01" name="loadValue" required step="0.01" type="number" />
          </label>
          <label>
            <span>Service time</span>
            <input defaultValue="10" max="1440" min="1" name="serviceMinutes" required type="number" />
          </label>
        </div>
        {error && <p role="alert">{error}</p>}
        <div className="modal-actions">
          <Button disabled={saving} onClick={onClose}>Cancel</Button>
          <Button disabled={saving} type="submit" variant="primary">
            {saving ? "Saving…" : "Create order"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function OrdersPage({
  date,
  orders,
  setOrders,
  globalSearch,
  loading,
  loadError,
  onRetry,
}: {
  date: string
  orders: Order[]
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>
  globalSearch: string
  loading: boolean
  loadError: string
  onRetry: () => void
}) {
  const [search, setSearch] = useState(globalSearch)
  const [status, setStatus] = useState("All statuses")
  const [priority, setPriority] = useState("All priorities")
  const [filterDate, setFilterDate] = useState("")
  const [selected, setSelected] = useState<Order | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const filtered = orders.filter(
    (o) =>
      `${o.id} ${o.customer} ${o.address}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (status === "All statuses" || o.status === status) &&
      (priority === "All priorities" || o.priority === priority) &&
      (!filterDate || o.date === filterDate),
  )
  const save = async (draft: OrderDraft) => {
    const order = await createOrder(draft)
    setOrders((current) => [order, ...current])
    setSearch("")
    setStatus("All statuses")
    setPriority("All priorities")
    setFilterDate("")
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
          <Button disabled={loading || Boolean(loadError)} onClick={() => setNewOpen(true)} variant="primary">
            <Icon name="plus" size={16} />
            New Order
          </Button>
        }
      />
      {loading && <p role="status">Loading orders…</p>}
      {loadError && (
        <div>
          <p role="alert">{loadError}</p>
          <Button onClick={onRetry}>Retry</Button>
        </div>
      )}
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
            onChange={(event) => setFilterDate(event.target.value)}
            value={filterDate}
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
            `${o.loadValue} kg`,
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
        <NewOrderModal date={date} onClose={() => setNewOpen(false)} onSave={save} />
      )}
    </div>
  )
}

function AddFleetModal({
  type,
  availableDrivers,
  onClose,
  onDriver,
  onVehicle,
}: {
  type: "Drivers" | "Vehicles"
  availableDrivers: Driver[]
  onClose: () => void
  onDriver: (driver: DriverDraft) => Promise<void>
  onVehicle: (vehicle: VehicleDraft) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const isDriver = type === "Drivers"
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    const fields = new FormData(event.currentTarget)
    setSaving(true)
    setError("")
    try {
      if (isDriver) {
        await onDriver({
          name: String(fields.get("name")),
          phone: String(fields.get("phone")),
          shiftStart: String(fields.get("shiftStart")),
          shiftEnd: String(fields.get("shiftEnd")),
        })
      } else {
        await onVehicle({
          registration: String(fields.get("registration")),
          type: String(fields.get("type")),
          capacity: Number(fields.get("capacity")),
          driverId: String(fields.get("driverId")) || null,
        })
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not save the fleet record.")
      setSaving(false)
    }
  }
  return (
    <Modal
      onClose={() => { if (!saving) onClose() }}
      subtitle={isDriver ? "Create an available driver profile." : "Add a vehicle to the operating fleet."}
      title={isDriver ? "Add driver" : "Add vehicle"}
    >
      <form className="form" onSubmit={submit}>
        <div className="form-grid">
          {isDriver ? (
            <>
              <label className="span-2">
                <span>Full name</span>
                <input maxLength={120} name="name" placeholder="Driver name" required />
              </label>
              <label className="span-2">
                <span>Phone</span>
                <input maxLength={40} name="phone" placeholder="+91 98765 00000" type="tel" />
              </label>
              <label>
                <span>Shift starts</span>
                <input defaultValue="09:00" name="shiftStart" required type="time" />
              </label>
              <label>
                <span>Shift ends</span>
                <input defaultValue="17:00" name="shiftEnd" required type="time" />
              </label>
            </>
          ) : (
            <>
              <label className="span-2">
                <span>Registration identifier</span>
                <input maxLength={24} name="registration" placeholder="e.g. HR-26-AB-1234" required />
              </label>
              <label>
                <span>Vehicle type</span>
                <select name="type">
                  <option>Delivery van</option>
                  <option>Mini truck</option>
                  <option>Mini van</option>
                </select>
              </label>
              <label>
                <span>Maximum capacity (kg)</span>
                <input defaultValue="180" min="0.01" name="capacity" required step="0.01" type="number" />
              </label>
              <label className="span-2">
                <span>Assigned driver</span>
                <select name="driverId">
                  <option value="">Unassigned</option>
                  {availableDrivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>{driver.name} ({driver.id})</option>
                  ))}
                </select>
              </label>
            </>
          )}
        </div>
        {error && <p role="alert">{error}</p>}
        <div className="modal-actions">
          <Button disabled={saving} onClick={onClose}>Cancel</Button>
          <Button disabled={saving} type="submit" variant="primary">
            {saving ? "Saving…" : isDriver ? "Save driver" : "Save vehicle"}
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
  loading,
  loadError,
  onRetry,
}: {
  drivers: Driver[]
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>
  vehicles: Vehicle[]
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>
  loading: boolean
  loadError: string
  onRetry: () => void
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
          <Button disabled={loading || Boolean(loadError)} onClick={() => setAdding(true)} variant="primary">
            <Icon name="plus" size={16} />
            Add {tab === "Drivers" ? "Driver" : "Vehicle"}
          </Button>
        }
      />
      {loading && <p role="status">Loading fleet…</p>}
      {loadError && (
        <div>
          <p role="alert">{loadError}</p>
          <Button onClick={onRetry}>Retry</Button>
        </div>
      )}
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
              <strong>{drivers.filter((driver) => driver.status === "On route").length}</strong>
            </div>
            <div>
              <span>Available</span>
              <strong>
                {drivers.filter((d) => d.status === "Available").length}
              </strong>
            </div>
            <div>
              <span>Deliveries assigned</span>
              <strong>{drivers.reduce((total, driver) => total + driver.assigned, 0)}</strong>
            </div>
            <div>
              <span>Completed today</span>
              <strong>{drivers.reduce((total, driver) => total + driver.completed, 0)}</strong>
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
          availableDrivers={drivers.filter((driver) => !vehicles.some((vehicle) => vehicle.driverId === driver.id))}
          onClose={() => setAdding(false)}
          onDriver={async (draft) => {
            const driver = await createDriver(draft)
            setDrivers((current) => [...current, driver])
            setAdding(false)
          }}
          onVehicle={async (draft) => {
            const vehicle = await createVehicle(draft)
            setVehicles((current) => [...current, vehicle])
            setAdding(false)
          }}
          type={tab}
        />
      )}
    </div>
  )
}

function TrackingPage({ date, setDate, goToPlanner, onDelivered }: {
  date: string
  setDate: (date: string) => void
  goToPlanner: () => void
  onDelivered: (orderId: string, driver: string) => void
}) {
  const [plan, setPlan] = useState<RoutePlan | null>(null)
  const [vehicle, setVehicle] = useState("")
  const [loading, setLoading] = useState(Boolean(date))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [request, setRequest] = useState(0)
  const route = plan?.routes.find((item) => item.vehicleId === vehicle) ?? plan?.routes[0]
  const next = route?.stops.find((stop) => !stop.completedAt)

  useEffect(() => {
    if (!date) return
    const controller = new AbortController()
    getLatestPlan(date, controller.signal)
      .then((saved) => { if (!controller.signal.aborted) setPlan(saved) })
      .catch(() => {
        if (!controller.signal.aborted) setError("Could not load the plan. Check that the RouteMind API is running.")
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [date, request])

  const changeDate = (nextDate: string) => {
    if (nextDate === date) return
    setPlan(null)
    setVehicle("")
    setError("")
    setLoading(Boolean(nextDate))
    setDate(nextDate)
  }

  const reload = () => {
    setLoading(true)
    setError("")
    setRequest((count) => count + 1)
  }

  const update = async (event: DeliveryUpdate) => {
    if (!plan || !route || saving || loading) return
    setSaving(true)
    setError("")
    try {
      const revised = await recordDeliveryEvent(date, plan.id, route.vehicleId, event)
      setPlan(revised)
      if (event.type === "delivered") onDelivered(event.orderId, route.driverName)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not save the delivery update.")
    } finally {
      setSaving(false)
    }
  }

  let suggestedCompletion = ""
  if (next) {
    const [hours, minutes] = next.eta.split(":").map(Number)
    const finish = Math.min(1439, hours * 60 + minutes + (next.serviceMinutes ?? 0))
    suggestedCompletion = `${String(Math.floor(finish / 60)).padStart(2, "0")}:${String(finish % 60).padStart(2, "0")}`
  }

  return (
    <div className="page tracking-page">
      <PageHeader
        title="Live Tracking"
        subtitle="Record delivery updates and recalculate pending stops using the demo travel estimates."
        actions={
          <label className="date-control">
            <Icon name="calendar" size={16} />
            <input aria-label="Tracking date" disabled={saving} onChange={(event) => changeDate(event.target.value)} type="date" value={date} />
          </label>
        }
      />
      {loading && <p role="status">Loading the latest plan…</p>}
      {saving && <p role="status">Saving the delivery update…</p>}
      {error && <div><p role="alert">{error}</p><Button disabled={loading || saving} onClick={reload}>Reload plan</Button></div>}
      {!loading && !error && !plan && (
        <div>
          <p>{date ? "Create a route plan for this date to start recording deliveries." : "Choose a tracking date."}</p>
          <Button onClick={goToPlanner}>Open Route Planner</Button>
        </div>
      )}
      {plan && (
        <>
          <div className="planner-note">
            <strong>Saved plan #{plan.id}{plan.previousPlanId ? ` · Revised from #${plan.previousPlanId}` : ""}</strong>
            {plan.event && (
              <span>{plan.event.type === "delay"
                ? `${plan.event.delayMinutes}-minute delay recorded for ${plan.event.vehicleId}`
                : `${plan.event.orderId} delivered at ${plan.event.at}`}</span>
            )}
          </div>
          {route ? (
            <section className="panel stop-panel">
              <div className="panel-head">
                <div>
                  <h2>Delivery stops</h2>
                  <p>{route.driverName} · {route.returnAt ? `Estimated depot return ${route.returnAt}` : "Depot return falls outside the shift"}</p>
                </div>
                <label>
                  Vehicle{" "}
                  <select className="select" disabled={saving || loading} value={route.vehicleId} onChange={(event) => setVehicle(event.target.value)}>
                    {plan.routes.map((item) => (
                      <option key={item.vehicleId} value={item.vehicleId}>{item.vehicleId} · {item.driverName}</option>
                    ))}
                  </select>
                </label>
              </div>
              <DataTable
                headers={["Stop", "Order", "Address", "ETA", "Delivery window", "Delivered at"]}
                rows={route.stops.map((stop, index) => [
                  index + 1, stop.orderId, stop.address, stop.eta, stop.window, stop.completedAt ?? "Pending",
                ])}
              />
              {next ? (
                <div className="tracking-actions" key={`${plan.id}-${route.vehicleId}`}>
                  <form className="form" onSubmit={(event) => {
                    event.preventDefault()
                    const fields = new FormData(event.currentTarget)
                    void update({ type: "delivered", orderId: next.orderId, at: String(fields.get("at")) })
                  }}>
                    <label>
                      <span>Completion time for {next.orderId}</span>
                      <input defaultValue={suggestedCompletion} name="at" required type="time" />
                    </label>
                    <Button disabled={saving || loading} type="submit" variant="primary">Mark next stop delivered</Button>
                  </form>
                  <form className="form" onSubmit={(event) => {
                    event.preventDefault()
                    const fields = new FormData(event.currentTarget)
                    void update({ type: "delay", minutes: Number(fields.get("minutes")) })
                  }}>
                    <label>
                      <span>Delay at the {route.stops.some((stop) => stop.completedAt) ? "last delivered stop" : "depot"} (minutes)</span>
                      <input defaultValue="15" max="720" min="1" name="minutes" required type="number" />
                    </label>
                    <Button disabled={saving || loading} type="submit">Report delay</Button>
                  </form>
                </div>
              ) : <p className="tracking-actions">No pending stops for this vehicle.</p>}
            </section>
          ) : <p>No vehicles have assigned stops on this plan.</p>}
          {plan.unassigned.length > 0 && (
            <section className="panel">
              <div className="panel-head"><div><h2>Unassigned orders ({plan.unassigned.length})</h2></div></div>
              <DataTable headers={["Order", "Address", "Reason"]} rows={plan.unassigned.map((order) => [order.orderId, order.address, order.reason])} />
            </section>
          )}
        </>
      )}
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
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState("")
  const [ordersRequest, setOrdersRequest] = useState(0)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [fleetLoading, setFleetLoading] = useState(true)
  const [fleetError, setFleetError] = useState("")
  const [fleetRequest, setFleetRequest] = useState(0)
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
    const controller = new AbortController()
    listOrders(controller.signal)
      .then((records) => { if (!controller.signal.aborted) setOrders(records) })
      .catch(() => {
        if (!controller.signal.aborted) setOrdersError("Could not load orders. Check that the RouteMind API is running.")
      })
      .finally(() => { if (!controller.signal.aborted) setOrdersLoading(false) })
    return () => controller.abort()
  }, [ordersRequest])
  useEffect(() => {
    const controller = new AbortController()
    listFleet(controller.signal)
      .then((fleet) => {
        if (controller.signal.aborted) return
        setDrivers(fleet.drivers)
        setVehicles(fleet.vehicles)
      })
      .catch(() => {
        if (!controller.signal.aborted) setFleetError("Could not load the fleet. Check that the RouteMind API is running.")
      })
      .finally(() => { if (!controller.signal.aborted) setFleetLoading(false) })
    return () => controller.abort()
  }, [fleetRequest])
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
              date={date}
              globalSearch={globalSearch}
              loadError={ordersError}
              loading={ordersLoading}
              onRetry={() => {
                setOrdersError("")
                setOrdersLoading(true)
                setOrdersRequest((request) => request + 1)
              }}
              orders={orders}
              setOrders={setOrders}
            />
          )}
          {page === "fleet" && (
            <FleetPage
              drivers={drivers}
              loadError={fleetError}
              loading={fleetLoading}
              onRetry={() => {
                setFleetError("")
                setFleetLoading(true)
                setFleetRequest((request) => request + 1)
              }}
              setDrivers={setDrivers}
              setVehicles={setVehicles}
              vehicles={vehicles}
            />
          )}
          {page === "tracking" && <TrackingPage
              date={date}
              setDate={setDate}
              goToPlanner={() => goTo("planner")}
              onDelivered={(orderId, driver) => {
                setOrders((records) => records.map((order) =>
                  order.id === orderId ? { ...order, status: "Delivered", driver } : order,
                ))
              }}
            />}
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
